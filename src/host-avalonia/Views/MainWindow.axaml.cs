using Avalonia.Animation;
using Avalonia.Controls;
using Avalonia.Media;
using Avalonia.Styling;
using Avalonia.Threading;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using WebViewControl;
using System.Runtime.InteropServices;
using Polygent.Api;

namespace WebHost;

public partial class MainWindow : Window
{
    private WebApplication? _webApp;
    private readonly HttpClient _httpClient = new();
    private readonly WebHostConfiguration _config;
    private readonly Timer? _focusMonitor;

    public MainWindow()
    {
        InitializeComponent();
        _config = LoadConfiguration();
        StartLoadingAnimation();
        _ = Task.Run(InitializeServicesAsync);
        
        // Handle window closing event for proper cleanup
        Closing += OnClosing;
        
        // Start monitoring for focus requests on non-Windows platforms
        if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            _focusMonitor = new Timer(CheckForFocusRequest, null, TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(1));
        }
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

    private void StartLoadingAnimation()
    {
        // Simple rotation animation for loading spinner
        var spinner = this.FindControl<Border>("LoadingSpinner");
        if (spinner != null)
        {
            var animation = new Animation
            {
                Duration = TimeSpan.FromSeconds(1),
                IterationCount = IterationCount.Infinite
            };

            var keyFrame1 = new KeyFrame
            {
                Cue = new Cue(0d)
            };
            keyFrame1.Setters.Add(new Setter(RotateTransform.AngleProperty, 0d));

            var keyFrame2 = new KeyFrame
            {
                Cue = new Cue(1d)
            };
            keyFrame2.Setters.Add(new Setter(RotateTransform.AngleProperty, 360d));

            animation.Children.Add(keyFrame1);
            animation.Children.Add(keyFrame2);
            animation.RunAsync(spinner);
        }
    }

    private async Task InitializeServicesAsync()
    {
        try
        {
            await Dispatcher.UIThread.InvokeAsync(() => UpdateLoadingText("Starting Polygent..."));

            // Build the web application
            _webApp = Startup.Build();

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
                    Dispatcher.UIThread.Post(() => UpdateLoadingText($"Error: {ex.Message}"));
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

            await Dispatcher.UIThread.InvokeAsync(() => UpdateLoadingText("Services failed to start. Please check your setup."));
        }
        catch (Exception ex)
        {
            await Dispatcher.UIThread.InvokeAsync(() => UpdateLoadingText($"Startup failed: {ex.Message}"));
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
        Dispatcher.UIThread.Post(() =>
        {
            var loadingText = this.FindControl<TextBlock>("LoadingText");
            if (loadingText != null)
            {
                loadingText.Text = message;
            }
        });
    }

    private async Task ShowWebView()
    {
        UpdateLoadingText("Loading Polygent interface...");

        await Dispatcher.UIThread.InvokeAsync(() =>
        {
            var webView = this.FindControl<WebView>("WebViewControl");
            var loadingOverlay = this.FindControl<Border>("LoadingOverlay");

            if (webView != null && loadingOverlay != null)
            {
                // Disable right-click context menu
                webView.ContextMenu =  null;
                webView.DisableBuiltinContextMenus = true;
                
                // Hide loading overlay and show WebView
                loadingOverlay.IsVisible = false;
                webView.IsVisible = true;
                webView.Address = _config.SiteUrl;
            }
        });
    }

    private async void OnClosing(object? sender, WindowClosingEventArgs e)
    {        
        // Perform cleanup asynchronously
        await StopWebApplicationAsync();
        
        // Now allow the window to close
        Closing -= OnClosing;
        Close();
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

    private void CheckForFocusRequest(object? state)
    {
        try
        {
            var focusPath = Path.Combine(Path.GetTempPath(), $"polygent_focus_{Environment.ProcessId}");
            if (File.Exists(focusPath))
            {
                Dispatcher.UIThread.Post(() =>
                {
                    WindowState = WindowState.Normal;
                    Activate();
                    Topmost = true;
                    Topmost = false;
                });
                
                File.Delete(focusPath);
            }
        }
        catch
        {
        }
    }

    protected override void OnClosed(EventArgs e)
    {
        // Final cleanup - most cleanup already done in OnClosing
        _focusMonitor?.Dispose();
        _httpClient?.Dispose();
        base.OnClosed(e);
    }
}