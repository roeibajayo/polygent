using Avalonia;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace WebHost;

class Program
{
    private static Mutex? _mutex;
    private static FileStream? _lockFile;
    private const string MutexName = "PolygentWebHostMutex";
    private const string LockFileName = "polygent_webhost.lock";

    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    private static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

    private const int SW_RESTORE = 9;

    [STAThread]
    public static void Main(string[] args)
    {
        bool isNewInstance = AcquireSingleInstanceLock();

        if (!isNewInstance)
        {
            FocusExistingInstance();
            return;
        }

        try
        {
            BuildAvaloniaApp().StartWithClassicDesktopLifetime(args);
        }
        finally
        {
            ReleaseSingleInstanceLock();
        }
    }

    private static bool AcquireSingleInstanceLock()
    {
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            _mutex = new Mutex(true, MutexName, out bool isNewInstance);
            return isNewInstance;
        }
        else
        {
            try
            {
                var lockPath = Path.Combine(Path.GetTempPath(), LockFileName);
                _lockFile = new FileStream(lockPath, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None);
                
                var processId = Environment.ProcessId.ToString();
                var bytes = System.Text.Encoding.UTF8.GetBytes(processId);
                _lockFile.Write(bytes, 0, bytes.Length);
                _lockFile.Flush();
                
                return true;
            }
            catch (IOException)
            {
                return false;
            }
        }
    }

    private static void ReleaseSingleInstanceLock()
    {
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            _mutex?.ReleaseMutex();
            _mutex?.Dispose();
        }
        else
        {
            _lockFile?.Dispose();
            
            try
            {
                var lockPath = Path.Combine(Path.GetTempPath(), LockFileName);
                if (File.Exists(lockPath))
                {
                    File.Delete(lockPath);
                }
            }
            catch
            {
            }
        }
    }

    private static void FocusExistingInstance()
    {
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            var handle = FindWindow(null!, "Polygent");
            if (handle != IntPtr.Zero)
            {
                ShowWindow(handle, SW_RESTORE);
                SetForegroundWindow(handle);
            }
        }
        else
        {
            try
            {
                var lockPath = Path.Combine(Path.GetTempPath(), LockFileName);
                if (File.Exists(lockPath))
                {
                    var processIdText = File.ReadAllText(lockPath);
                    if (int.TryParse(processIdText, out int processId))
                    {
                        try
                        {
                            var process = Process.GetProcessById(processId);
                            var focusPath = Path.Combine(Path.GetTempPath(), $"polygent_focus_{processId}");
                            File.WriteAllText(focusPath, DateTime.UtcNow.ToString());
                        }
                        catch (ArgumentException)
                        {
                        }
                    }
                }
            }
            catch
            {
            }
        }
    }

    public static AppBuilder BuildAvaloniaApp()
        => AppBuilder.Configure<App>()
            .UsePlatformDetect()
            .LogToTrace();
}