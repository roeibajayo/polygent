using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Polygent.Logic.Context;
using Polygent.Logic.Interfaces;
using Polygent.Logic.Models;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;

namespace Polygent.Logic.Repositories;

internal sealed class EnvironmentRepository(ILogger<EnvironmentRepository> logger, PolygentContext context) 
    : IEnvironmentRepository, IScopedService<IEnvironmentRepository>
{
    public async Task<int> CreateAsync(EnvironmentEntity environment, CancellationToken cancellationToken)
    {
        try
        {
            var model = new EnvironmentModel
            {
                Id = environment.Id,
                WorkspaceId = environment.WorkspaceId,
                Name = environment.Name,
                GitBranch = environment.GitBranch,
                Url = environment.Url,
                EnvironmentVariables = environment.EnvironmentVariables,
                CreatedAt = environment.CreatedAt,
                UpdatedAt = environment.UpdatedAt
            };

            context.Environments.Add(model);
            await context.SaveChangesAsync(cancellationToken);
            return model.Id;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while creating environment {EnvironmentName}.", environment.Name);
            throw;
        }
    }

    public async Task<EnvironmentEntity?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        try
        {
            var model = await context.Environments
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (model is null)
                return null;

            return new EnvironmentEntity(
                model.Id,
                model.WorkspaceId,
                model.Name,
                model.GitBranch,
                model.Url,
                model.EnvironmentVariables,
                model.CreatedAt,
                model.UpdatedAt
            );
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting environment by ID {EnvironmentId}.", id);
            throw;
        }
    }

    public async Task<EnvironmentEntity?> GetByAliasAsync(int workspaceId, string alias, CancellationToken cancellationToken)
    {
        try
        {
            var model = await context.Environments
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.WorkspaceId == workspaceId && x.Name == alias, cancellationToken);

            if (model is null)
                return null;

            return new EnvironmentEntity(
                model.Id,
                model.WorkspaceId,
                model.Name,
                model.GitBranch,
                model.Url,
                model.EnvironmentVariables,
                model.CreatedAt,
                model.UpdatedAt
            );
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting environment by alias {Alias} for workspace {WorkspaceId}.", alias, workspaceId);
            throw;
        }
    }

    public async Task<EnvironmentEntity[]> GetByWorkspaceIdAsync(int workspaceId, CancellationToken cancellationToken)
    {
        try
        {
            var models = await context.Environments
                .AsNoTracking()
                .Where(x => x.WorkspaceId == workspaceId)
                .OrderBy(x => x.Name)
                .ToArrayAsync(cancellationToken);

            return models.Select(static model => new EnvironmentEntity(
                model.Id,
                model.WorkspaceId,
                model.Name,
                model.GitBranch,
                model.Url,
                model.EnvironmentVariables,
                model.CreatedAt,
                model.UpdatedAt
            )).ToArray();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting environments for workspace {WorkspaceId}.", workspaceId);
            throw;
        }
    }

    public async Task<bool> UpdateAsync(EnvironmentEntity environment, CancellationToken cancellationToken)
    {
        try
        {
            var model = await context.Environments
                .FirstOrDefaultAsync(x => x.Id == environment.Id, cancellationToken);

            if (model is null)
                return false;

            model.Name = environment.Name;
            model.GitBranch = environment.GitBranch;
            model.Url = environment.Url;
            model.EnvironmentVariables = environment.EnvironmentVariables;
            model.UpdatedAt = environment.UpdatedAt;

            await context.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while updating environment {EnvironmentId}.", environment.Id);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        try
        {
            var model = await context.Environments
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (model is null)
                return false;

            context.Environments.Remove(model);
            await context.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while deleting environment {EnvironmentId}.", id);
            throw;
        }
    }
}