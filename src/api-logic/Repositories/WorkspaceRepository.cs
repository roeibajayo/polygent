using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Polygent.Logic.Context;
using Polygent.Logic.Interfaces;
using Polygent.Logic.Models;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;

namespace Polygent.Logic.Repositories;

internal sealed class WorkspaceRepository(ILogger<WorkspaceRepository> logger, PolygentContext context)
    : IWorkspaceRepository, IScopedService<IWorkspaceRepository>
{
    public async Task<int> CreateAsync(WorkspaceEntity workspace, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Creating workspace {WorkspaceName}.", workspace.Name);

            var model = new WorkspaceModel
            {
                Id = workspace.Id,
                Name = workspace.Name,
                GitRepository = workspace.GitRepository,
                CreatedAt = workspace.CreatedAt,
                UpdatedAt = workspace.UpdatedAt
            };

            context.Workspaces.Add(model);
            await context.SaveChangesAsync(cancellationToken);

            logger.LogInformation("Successfully created workspace {WorkspaceName} with ID {WorkspaceId}.", workspace.Name, model.Id);
            return model.Id;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while creating workspace {WorkspaceName}.", workspace.Name);
            throw;
        }
    }

    public async Task<WorkspaceEntity?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        try
        {
            var model = await context.Workspaces
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (model is null)
            {
                logger.LogInformation("Workspace with ID {WorkspaceId} not found.", id);
                return null;
            }

            var entity = new WorkspaceEntity(
                model.Id,
                model.Name,
                model.GitRepository,
                model.EnvironmentVariables.ToDictionary(x => x.Key, x => x.Value),
                model.CreatedAt,
                model.UpdatedAt
            );

            return entity;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting workspace by ID {WorkspaceId}.", id);
            throw;
        }
    }

    public async Task<WorkspaceEntity[]> GetAllAsync(CancellationToken cancellationToken)
    {
        try
        {
            var models = await context.Workspaces
                .AsNoTracking()
                .OrderBy(x => x.Name)
                .ToArrayAsync(cancellationToken);

            var entities = models.Select(static model => new WorkspaceEntity(
                model.Id,
                model.Name,
                model.GitRepository,
                model.EnvironmentVariables.ToDictionary(x => x.Key, x => x.Value),
                model.CreatedAt,
                model.UpdatedAt
            )).ToArray();

            return entities;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting all workspaces.");
            throw;
        }
    }

    public async Task<bool> UpdateAsync(WorkspaceEntity workspace, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Updating workspace {WorkspaceId}.", workspace.Id);

            var model = await context.Workspaces
                .FirstOrDefaultAsync(x => x.Id == workspace.Id, cancellationToken);

            if (model is null)
            {
                logger.LogWarning("Workspace with ID {WorkspaceId} not found for update.", workspace.Id);
                return false;
            }

            model.Name = workspace.Name;
            model.GitRepository = workspace.GitRepository;
            model.UpdatedAt = workspace.UpdatedAt;

            await context.SaveChangesAsync(cancellationToken);

            logger.LogInformation("Successfully updated workspace {WorkspaceId}.", workspace.Id);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while updating workspace {WorkspaceId}.", workspace.Id);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Deleting workspace {WorkspaceId}.", id);

            var model = await context.Workspaces
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (model is null)
            {
                logger.LogWarning("Workspace with ID {WorkspaceId} not found for deletion.", id);
                return false;
            }

            context.Workspaces.Remove(model);
            await context.SaveChangesAsync(cancellationToken);

            logger.LogInformation("Successfully deleted workspace {WorkspaceId}.", id);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while deleting workspace {WorkspaceId}.", id);
            throw;
        }
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken)
    {
        try
        {
            var exists = await context.Workspaces
                .AsNoTracking()
                .AnyAsync(x => x.Id == id, cancellationToken);

            return exists;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while checking if workspace {WorkspaceId} exists.", id);
            throw;
        }
    }
}