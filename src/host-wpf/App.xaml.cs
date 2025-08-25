using System;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows;

namespace WebHostWPF;

public partial class App : Application
{
    private static Mutex? _mutex;
    private const string MutexName = "PolygentWebHostWPFMutex";

    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    private static extern IntPtr FindWindow(string? lpClassName, string lpWindowName);

    private const int SW_RESTORE = 9;

    protected override void OnStartup(StartupEventArgs e)
    {
        bool isNewInstance = AcquireSingleInstanceLock();

        if (!isNewInstance)
        {
            System.Diagnostics.Debug.WriteLine("Another instance is already running. Attempting to focus existing window.");
            FocusExistingInstance();
            System.Diagnostics.Debug.WriteLine("Shutting down duplicate instance.");
            Shutdown();
            return;
        }

        System.Diagnostics.Debug.WriteLine("This is the first instance. Starting application.");
        base.OnStartup(e);
        
        // Set the main window
        MainWindow = new MainWindow();
        MainWindow.Show();
    }

    protected override void OnExit(ExitEventArgs e)
    {
        ReleaseSingleInstanceLock();
        base.OnExit(e);
    }

    private static bool AcquireSingleInstanceLock()
    {
        try
        {
            System.Diagnostics.Debug.WriteLine($"Attempting to acquire mutex: {MutexName}");
            _mutex = new Mutex(true, MutexName, out bool isNewInstance);
            System.Diagnostics.Debug.WriteLine($"Mutex acquired. Is new instance: {isNewInstance}");
            if (!isNewInstance)
            {
                // Another instance is already running
                return false;
            }
            return true;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Exception acquiring mutex: {ex.Message}");
            // If mutex creation fails, assume another instance is running
            return false;
        }
    }

    private static void ReleaseSingleInstanceLock()
    {
        _mutex?.ReleaseMutex();
        _mutex?.Dispose();
    }

    private static void FocusExistingInstance()
    {
        System.Diagnostics.Debug.WriteLine("Searching for existing window with title: Polygent");
        var handle = FindWindow(null, "Polygent");
        System.Diagnostics.Debug.WriteLine($"Found window handle: {handle}");
        if (handle != IntPtr.Zero)
        {
            System.Diagnostics.Debug.WriteLine("Attempting to focus existing window");
            ShowWindow(handle, SW_RESTORE);
            SetForegroundWindow(handle);
        }
        else
        {
            System.Diagnostics.Debug.WriteLine("No existing window found");
        }
    }
}