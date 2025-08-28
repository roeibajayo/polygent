using Microsoft.AspNetCore.Mvc;
using Polygent.Api.Dtos;
using Polygent.Api.EndpointsInfrastructure;

namespace Polygent.Api.Endpoints.Sessions.Files;

internal sealed class GetAvailableEditorsEndpoint : IGetEndpoint
{
    public string Route => "/api/sessions/{sessionId}/editors";
    
    public Delegate Execute => static (
        [FromRoute] int sessionId,
        CancellationToken cancellationToken) =>
    {
        // Common editor configurations
        var editors = new List<EditorDto>
        {
            new("vscode", "code", "Visual Studio Code", "code", CheckExecutableExists("code")),
            new("vscode-insiders", "code-insiders", "Visual Studio Code Insiders", "code-insiders", CheckExecutableExists("code-insiders")),
            new("vs2022", "devenv", "Visual Studio 2022", @"C:\Program Files\Microsoft Visual Studio\2022\Professional\Common7\IDE\devenv.exe", CheckFileExists(@"C:\Program Files\Microsoft Visual Studio\2022\Professional\Common7\IDE\devenv.exe")),
            new("vs2022-community", "devenv", "Visual Studio 2022 Community", @"C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE\devenv.exe", CheckFileExists(@"C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE\devenv.exe")),
            new("vs2022-enterprise", "devenv", "Visual Studio 2022 Enterprise", @"C:\Program Files\Microsoft Visual Studio\2022\Enterprise\Common7\IDE\devenv.exe", CheckFileExists(@"C:\Program Files\Microsoft Visual Studio\2022\Enterprise\Common7\IDE\devenv.exe")),
            new("notepadpp", "notepad++", "Notepad++", @"C:\Program Files\Notepad++\notepad++.exe", CheckFileExists(@"C:\Program Files\Notepad++\notepad++.exe")),
            new("notepadpp-x86", "notepad++", "Notepad++ (x86)", @"C:\Program Files (x86)\Notepad++\notepad++.exe", CheckFileExists(@"C:\Program Files (x86)\Notepad++\notepad++.exe")),
            new("notepad", "notepad", "Notepad", "notepad", CheckExecutableExists("notepad")),
            new("vim", "vim", "Vim", "vim", CheckExecutableExists("vim")),
            new("nano", "nano", "Nano", "nano", CheckExecutableExists("nano"))
        };

        // Only return available editors
        var availableEditors = editors.Where(e => e.IsAvailable).ToArray();
        
        return Results.Ok(availableEditors);
    };
    
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
    
    private static bool CheckExecutableExists(string command)
    {
        try
        {
            var processStartInfo = new System.Diagnostics.ProcessStartInfo
            {
                FileName = "where",
                Arguments = command,
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            
            using var process = System.Diagnostics.Process.Start(processStartInfo);
            if (process != null)
            {
                process.WaitForExit();
                return process.ExitCode == 0;
            }
            
            return false;
        }
        catch
        {
            return false;
        }
    }
}