using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Web.WebView2.Core;
using Polygent.Logic.Services;
using System;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using System.Windows;

namespace WebHostWPF;

public partial class MainWindow : Window
{
    private WebApplication? _webApp;
    private readonly HttpClient _httpClient = new();
    private readonly WebHostConfiguration _config;

    public MainWindow()
    {
        InitializeComponent();
        _config = LoadConfiguration();
        
        // Start background initialization
        _ = Task.Run(InitializeServicesAsync);
        
        // Handle window closing event for proper cleanup
        Closing += OnClosing;
    }

    private static WebHostConfiguration LoadConfiguration()
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false)
            .Build();

        var config = new WebHostConfiguration();
        configuration.GetSection("WebHost").Bind(config);
        return config;
    }

    private async Task InitializeServicesAsync()
    {
        try
        {
            await Dispatcher.InvokeAsync(() => UpdateLoadingText("Starting Polygent..."));

            // Build the web application
            _webApp = Polygent.Startup.Build();

            // Start the server asynchronously
            _ = Task.Run(async () =>
            {
                try
                {
                    await _webApp.RunAsync("https://localhost:6457");
                    await Task.Delay(_config.HealthCheckIntervalMs);
                }
                catch (Exception ex)
                {
                    Dispatcher.Invoke(() => UpdateLoadingText($"Error: {ex.Message}"));
                }
            });

            // Wait for both services to be healthy
            var retries = 0;

            while (retries < _config.HealthCheckRetries)
            {
                if (await CheckServicesHealth())
                {
                    // Services are ready, show WebView
                    await ShowWebView();
                    return;
                }

                await Task.Delay(_config.HealthCheckIntervalMs);
                retries++;
            }

            await Dispatcher.InvokeAsync(() => UpdateLoadingText("Services failed to start. Please check your setup."));
        }
        catch (Exception ex)
        {
            await Dispatcher.InvokeAsync(() => UpdateLoadingText($"Startup failed: {ex.Message}"));
        }
    }

    private async Task<bool> CheckServicesHealth()
    {
        try
        {
            // Check if configured site URL is responding
            var clientResponse = await _httpClient.GetAsync(_config.SiteUrl + "/api/ping");
            return clientResponse.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private void UpdateLoadingText(string message)
    {
        Dispatcher.Invoke(() =>
        {
            LoadingText.Text = message;
        });
    }

    private async Task ShowWebView()
    {
        UpdateLoadingText("Loading Polygent interface...");

        await Dispatcher.InvokeAsync(async () =>
        {
            try
            {
                // Initialize WebView2 environment
                var userDataFolder = Path.Combine(StorageService.StoragePath, "WebView2");
                var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
                await WebViewControl.EnsureCoreWebView2Async(env);
                
                // Configure WebView2 settings
                WebViewControl.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
                WebViewControl.CoreWebView2.Settings.AreDefaultScriptDialogsEnabled = true;
                WebViewControl.CoreWebView2.Settings.IsWebMessageEnabled = true;
                WebViewControl.CoreWebView2.Settings.AreDevToolsEnabled = false;
                
                // Navigate to the site
                WebViewControl.CoreWebView2.Navigate(_config.SiteUrl);
            }
            catch (Exception ex)
            {
                UpdateLoadingText($"WebView initialization failed: {ex.Message}");
            }
        });
    }

    private void WebView_NavigationCompleted(object? sender, CoreWebView2NavigationCompletedEventArgs e)
    {
        Dispatcher.Invoke(() =>
        {
            if (e.IsSuccess)
            {
                // Hide loading overlay and show WebView
                LoadingOverlay.Visibility = Visibility.Collapsed;
                WebViewControl.Visibility = Visibility.Visible;
            }
            else
            {
                UpdateLoadingText("Failed to load Polygent interface.");
            }
        });
    }

    private async void OnClosing(object? sender, System.ComponentModel.CancelEventArgs e)
    {        
        // Perform cleanup asynchronously
        await StopWebApplicationAsync();
    }

    private async Task StopWebApplicationAsync()
    {
        if (_webApp != null)
        {
            try
            {
                // Stop the web application gracefully
                await _webApp.DisposeAsync();
            }
            catch (Exception ex)
            {
                // Log error but don't block shutdown
                Console.WriteLine($"Error stopping web application: {ex.Message}");
            }
        }
    }

    protected override void OnClosed(EventArgs e)
    {
        // Final cleanup
        _httpClient?.Dispose();
        base.OnClosed(e);
    }
}