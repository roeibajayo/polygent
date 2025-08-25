using System.Diagnostics;
using System.Text;

namespace Polygent.Logic.Helpers;

public static class ProcessHelpers
{

    public static bool OpenFileWithEditor(string editorId, string filePath)
    {
        try
        {
            // Clean up the file path - remove trailing whitespace and normalize path separators
            var originalPath = filePath;
            filePath = filePath.Trim().TrimEnd('\\', '/');
            
            // Validate that the path exists
            if (!File.Exists(filePath) && !Directory.Exists(filePath))
            {
                return false;
            }
            
            var isDirectory = Directory.Exists(filePath);
            
            // Add trailing slash for directories if needed
            var finalPath = isDirectory ? Path.TrimEndingDirectorySeparator(filePath) + Path.DirectorySeparatorChar : filePath;
            
            var processStartInfo = editorId switch
            {
                "vscode" => GetVSCodeProcessStartInfo(finalPath),
                "vscode-insiders" => GetVSCodeInsidersProcessStartInfo(finalPath),
                "vs2022" when CheckFileExists(@"C:\Program Files\Microsoft Visual Studio\2022\Professional\Common7\IDE\devenv.exe") => 
                    new ProcessStartInfo(@"C:\Program Files\Microsoft Visual Studio\2022\Professional\Common7\IDE\devenv.exe", $"\"{finalPath}\""),
                "vs2022-community" when CheckFileExists(@"C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE\devenv.exe") => 
                    new ProcessStartInfo(@"C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE\devenv.exe", $"\"{finalPath}\""),
                "vs2022-enterprise" when CheckFileExists(@"C:\Program Files\Microsoft Visual Studio\2022\Enterprise\Common7\IDE\devenv.exe") => 
                    new ProcessStartInfo(@"C:\Program Files\Microsoft Visual Studio\2022\Enterprise\Common7\IDE\devenv.exe", $"\"{finalPath}\""),
                "notepadpp" when !isDirectory && CheckFileExists(@"C:\Program Files\Notepad++\notepad++.exe") => 
                    new ProcessStartInfo(@"C:\Program Files\Notepad++\notepad++.exe", $"\"{finalPath}\""),
                "notepadpp-x86" when !isDirectory && CheckFileExists(@"C:\Program Files (x86)\Notepad++\notepad++.exe") => 
                    new ProcessStartInfo(@"C:\Program Files (x86)\Notepad++\notepad++.exe", $"\"{finalPath}\""),
                "notepad" when !isDirectory => CreateProcessStartInfoFromPath("notepad", finalPath),
                "vim" => CreateProcessStartInfoFromPath("vim", finalPath),
                "nano" => CreateProcessStartInfoFromPath("nano", finalPath),
                _ => null
            };

            if (processStartInfo == null)
            {
                return false;
            }

            HideProcessWindow(processStartInfo, false);
            using var process = Process.Start(processStartInfo);
            var success = process != null;
            
            return success;
        }
        catch (Exception ex)
        {
            return false;
        }
    }

    public static void HideProcessWindow(ProcessStartInfo startInfo, bool setOutput = true, bool setInput = false)
    {
        startInfo.WindowStyle = ProcessWindowStyle.Hidden;
        startInfo.CreateNoWindow = true;
        startInfo.UseShellExecute = false;
        if (setOutput)
        {
            startInfo.RedirectStandardError = true;
            startInfo.RedirectStandardOutput = true;
            startInfo.StandardOutputEncoding = Encoding.UTF8;
            startInfo.StandardErrorEncoding = Encoding.UTF8;
        }
        if (setInput)
        {
            startInfo.RedirectStandardInput = true;
            startInfo.StandardInputEncoding = Encoding.UTF8;
        }
    }

    private static ProcessStartInfo? GetVSCodeProcessStartInfo(string path)
    {
        // First try to find 'code' command in PATH
        var codeExecutablePath = GetExecutablePath("code");
        if (codeExecutablePath != null)
        {
            return new ProcessStartInfo(codeExecutablePath, $"\"{path}\"");
        }
        
        // Try common VS Code installation paths as fallback
        var vscodeExecutables = new[]
        {
            @"C:\Users\" + Environment.UserName + @"\AppData\Local\Programs\Microsoft VS Code\Code.exe",
            @"C:\Program Files\Microsoft VS Code\Code.exe",
            @"C:\Program Files (x86)\Microsoft VS Code\Code.exe"
        };

        foreach (var executable in vscodeExecutables)
        {
            if (File.Exists(executable))
            {
                return new ProcessStartInfo(executable, $"\"{path}\"");
            }
        }

        return null;
    }

    private static ProcessStartInfo? GetVSCodeInsidersProcessStartInfo(string path)
    {
        // First try to find 'code-insiders' command in PATH
        var codeInsidersExecutablePath = GetExecutablePath("code-insiders");
        if (codeInsidersExecutablePath != null)
        {
            return new ProcessStartInfo(codeInsidersExecutablePath, $"\"{path}\"");
        }
        
        // Try common VS Code Insiders installation paths as fallback
        var vscodeInsidersExecutables = new[]
        {
            @"C:\Users\" + Environment.UserName + @"\AppData\Local\Programs\Microsoft VS Code Insiders\Code - Insiders.exe",
            @"C:\Program Files\Microsoft VS Code Insiders\Code - Insiders.exe",
            @"C:\Program Files (x86)\Microsoft VS Code Insiders\Code - Insiders.exe"
        };

        foreach (var executable in vscodeInsidersExecutables)
        {
            if (File.Exists(executable))
            {
                return new ProcessStartInfo(executable, $"\"{path}\"");
            }
        }

        return null;
    }
    
    private static bool CheckFileExists(string path)
    {
        try
        {
            return File.Exists(path);
        }
        catch
        {
            return false;
        }
    }
    
    private static string? GetExecutablePath(string command)
    {
        try
        {
            var processStartInfo = new ProcessStartInfo
            {
                FileName = "where",
                Arguments = command,
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            
            using var process = Process.Start(processStartInfo);
            if (process != null)
            {
                var output = process.StandardOutput.ReadToEnd().Trim();
                process.WaitForExit();
                
                if (process.ExitCode == 0 && !string.IsNullOrEmpty(output))
                {
                    // Return the first path if multiple paths are found
                    return output.Split('\n').FirstOrDefault()?.Trim();
                }
            }
            
            return null;
        }
        catch
        {
            return null;
        }
    }
    
    private static ProcessStartInfo? CreateProcessStartInfoFromPath(string command, string filePath)
    {
        var executablePath = GetExecutablePath(command);
        return executablePath != null ? new ProcessStartInfo(executablePath, $"\"{filePath}\"") : null;
    }
}
