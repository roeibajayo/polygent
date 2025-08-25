using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Polygent.Logic.Context;
using Polygent.Logic.Interfaces;
using Polygent.Logic.Models;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;

namespace Polygent.Logic.Repositories;

internal sealed class WorkspaceEnvironmentVariableRepository(
    ILogger<WorkspaceEnvironmentVariableRepository> logger,
    PolygentContext context)
    : IWorkspaceEnvironmentVariableRepository, IScopedService<IWorkspaceEnvironmentVariableRepository>
{
    public async Task<Dictionary<string, string>?> GetByWorkspaceIdAsync(int workspaceId, CancellationToken cancellationToken)
    {
        try
        {
            // First check if workspace exists
            var workspaceExists = await context.Workspaces.AnyAsync(w => w.Id == workspaceId, cancellationToken);
            if (!workspaceExists)
            {
                return null;
            }

            var variables = await context.WorkspaceEnvironmentVariables
                .Where(v => v.WorkspaceId == workspaceId)
                .ToDictionaryAsync(v => v.Key, v => v.Value, cancellationToken);
                
            return variables;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting environment variables for workspace {WorkspaceId}.", workspaceId);
            throw;
        }
    }

    public async Task<bool> SetAsync(int workspaceId, string key, string value, CancellationToken cancellationToken)
    {
        try
        {
            // Check if workspace exists
            var workspaceExists = await context.Workspaces.AnyAsync(w => w.Id == workspaceId, cancellationToken);
            if (!workspaceExists)
            {
                return false;
            }

            // Check if variable already exists
            var existingVariable = await context.WorkspaceEnvironmentVariables
                .FirstOrDefaultAsync(v => v.WorkspaceId == workspaceId && v.Key == key, cancellationToken);
                
            if (existingVariable != null)
            {
                return false; // Variable already exists, use UpdateAsync instead
            }

            var now = DateTime.UtcNow;
            var variable = new WorkspaceEnvironmentVariableModel
            {
                WorkspaceId = workspaceId,
                Key = key,
                Value = value,
                CreatedAt = now,
                UpdatedAt = now
            };

            context.WorkspaceEnvironmentVariables.Add(variable);
            var rowsAffected = await context.SaveChangesAsync(cancellationToken);
            
            return rowsAffected > 0;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while setting environment variable {Key} for workspace {WorkspaceId}.", key, workspaceId);
            throw;
        }
    }

    public async Task<bool> UpdateAsync(int workspaceId, string key, string value, CancellationToken cancellationToken)
    {
        try
        {
            var variable = await context.WorkspaceEnvironmentVariables
                .FirstOrDefaultAsync(v => v.WorkspaceId == workspaceId && v.Key == key, cancellationToken);
                
            if (variable == null)
            {
                return false;
            }

            variable.Value = value;
            variable.UpdatedAt = DateTime.UtcNow;
            
            var rowsAffected = await context.SaveChangesAsync(cancellationToken);
            return rowsAffected > 0;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while updating environment variable {Key} for workspace {WorkspaceId}.", key, workspaceId);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int workspaceId, string key, CancellationToken cancellationToken)
    {
        try
        {
            var variable = await context.WorkspaceEnvironmentVariables
                .FirstOrDefaultAsync(v => v.WorkspaceId == workspaceId && v.Key == key, cancellationToken);
                
            if (variable == null)
            {
                return false;
            }

            context.WorkspaceEnvironmentVariables.Remove(variable);
            var rowsAffected = await context.SaveChangesAsync(cancellationToken);
            
            return rowsAffected > 0;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while deleting environment variable {Key} for workspace {WorkspaceId}.", key, workspaceId);
            throw;
        }
    }

    public async Task<bool> ExistsAsync(int workspaceId, string key, CancellationToken cancellationToken)
    {
        try
        {
            return await context.WorkspaceEnvironmentVariables
                .AnyAsync(v => v.WorkspaceId == workspaceId && v.Key == key, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while checking if environment variable {Key} exists for workspace {WorkspaceId}.", key, workspaceId);
            throw;
        }
    }
}