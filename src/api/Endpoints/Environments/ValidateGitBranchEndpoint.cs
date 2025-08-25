using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Environments;

internal sealed class ValidateGitBranchEndpoint : IGetEndpoint
{
    public string Route => "/api/workspaces/{workspaceId}/environments/validate-branch/{branch}";
    
    public Delegate Execute => static async (
        [FromRoute] int workspaceId,
        [FromRoute] string branch,
        IGitService gitService,
        IStorageService storageService,
        CancellationToken cancellationToken) =>
    {
        try
        {
            // Basic validation for branch name format
            if (string.IsNullOrWhiteSpace(branch))
                return Results.BadRequest("Branch name cannot be empty");

            if (branch.Contains(' '))
                return Results.BadRequest("Git branch names cannot contain spaces");

            if (branch.StartsWith('-') || branch.EndsWith('-'))
                return Results.BadRequest("Git branch names cannot start or end with hyphen");

            if (!System.Text.RegularExpressions.Regex.IsMatch(branch, @"^[a-zA-Z0-9._/-]+$"))
                return Results.BadRequest("Git branch contains invalid characters");

            // Get the workspace git directory
            var workspacePath = storageService.GetWorkspacePath(workspaceId);
            var gitPath = storageService.GetGitPath(workspaceId);

            // Check if the branch exists in the repository
            var branchExists = await gitService.BranchExistsAsync(gitPath, branch, cancellationToken);
            
            if (!branchExists)
                return Results.BadRequest("Branch does not exist in the repository");

            return Results.Ok(new { valid = true, message = "Branch is valid" });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Failed to validate git branch: {ex.Message}");
        }
    };
}