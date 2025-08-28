using Polygent.Api.Dtos;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints;

internal sealed class StartupEndpoint : IGetEndpoint
{
    public string Route => "/api/startup";
    
    public Delegate Execute => static async (
        IWorkspaceManagement workspaceManagement,
        IEnvironmentManagement environmentManagement,
        CancellationToken cancellationToken) =>
    {
        // Get all workspaces
        var workspaces = await workspaceManagement.ListAsync(cancellationToken);
        var workspaceDtos = workspaces.Select(static x => new WorkspaceDto(
            x.Id,
            x.Name,
            x.GitRepository,
            x.CreatedAt,
            x.UpdatedAt
        )).ToArray();

        // Get all environments for all workspaces
        var allEnvironments = new List<EnvironmentDto>();
        foreach (var workspace in workspaces)
        {
            try
            {
                var environments = await environmentManagement.GetByWorkspaceIdAsync(workspace.Id, cancellationToken);
                var environmentDtos = environments.Select(static x => new EnvironmentDto(
                    x.Id,
                    x.WorkspaceId,
                    x.Name,
                    x.GitBranch,
                    x.Url,
                    x.EnvironmentVariables,
                    x.CreatedAt,
                    x.UpdatedAt
                )).ToArray();
                allEnvironments.AddRange(environmentDtos);
            }
            catch
            {
                // Skip if workspace has no environments or error loading
                continue;
            }
        }

        // Get available editors
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

        var startupData = new StartupDto(
            workspaceDtos,
            allEnvironments.ToArray(),
            availableEditors
        );

        return Results.Ok(startupData);
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