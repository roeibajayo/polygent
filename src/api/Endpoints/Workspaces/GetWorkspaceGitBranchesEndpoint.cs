using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Workspaces;

internal sealed class GetWorkspaceGitBranchesEndpoint : IGetEndpoint
{
    public string Route => "/api/workspaces/{workspaceId}/git/branches";
    
    public Delegate Execute => static async (
        [FromRoute] int workspaceId,
        IGitService gitService,
        IStorageService storageService,
        CancellationToken cancellationToken) =>
    {
        try
        {
            // Get the workspace git directory
            var workspacePath = storageService.GetWorkspacePath(workspaceId);
            var gitPath = storageService.GetGitPath(workspaceId);

            // Check if git directory exists
            if (!Directory.Exists(gitPath))
                return Results.NotFound("Git repository not found for workspace");

            // Get all branches
            var branches = await gitService.GetBranchesAsync(gitPath, cancellationToken);
            
            // Clean up branch names (remove origin/ prefix, asterisk, etc.)
            var cleanBranches = branches
                .Select(branch => branch
                    .Replace("origin/", "")
                    .Replace("remotes/origin/", "")
                    .Trim())
                .Where(branch => !string.IsNullOrWhiteSpace(branch) && branch != "HEAD")
                .Distinct()
                .OrderBy(branch => branch)
                .ToArray();

            return Results.Ok(cleanBranches);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Failed to get git branches: {ex.Message}");
        }
    };
}