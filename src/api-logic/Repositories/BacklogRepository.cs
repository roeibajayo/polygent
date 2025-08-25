using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Polygent.Logic.Context;
using Polygent.Logic.Interfaces;
using Polygent.Logic.Models;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;

namespace Polygent.Logic.Repositories;

internal sealed class BacklogRepository(ILogger<BacklogRepository> logger, PolygentContext context) 
    : IBacklogRepository, IScopedService<IBacklogRepository>
{
    public async Task<int> CreateAsync(BacklogEntity backlog, CancellationToken cancellationToken)
    {
        try
        {
            var model = new BacklogModel
            {
                Id = backlog.Id,
                Title = backlog.Title,
                Description = backlog.Description,
                Status = backlog.Status,
                Tags = backlog.Tags,
                WorkspaceId = backlog.WorkspaceId,
                SessionId = backlog.SessionId,
                CreatedAt = backlog.CreatedAt,
                UpdatedAt = backlog.UpdatedAt
            };

            context.Backlogs.Add(model);
            await context.SaveChangesAsync(cancellationToken);
            return model.Id;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while creating backlog {BacklogTitle}.", backlog.Title);
            throw;
        }
    }

    public async Task<BacklogEntity?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        try
        {
            var model = await context.Backlogs
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (model is null)
                return null;

            return new BacklogEntity(
                model.Id,
                model.Title,
                model.Description,
                model.Status,
                model.Tags,
                model.WorkspaceId,
                model.SessionId,
                model.CreatedAt,
                model.UpdatedAt
            );
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting backlog by ID {BacklogId}.", id);
            throw;
        }
    }

    public async Task<BacklogEntity[]> GetAllAsync(CancellationToken cancellationToken)
    {
        try
        {
            var models = await context.Backlogs
                .AsNoTracking()
                .OrderByDescending(x => x.CreatedAt)
                .ToArrayAsync(cancellationToken);

            return models.Select(static model => new BacklogEntity(
                model.Id,
                model.Title,
                model.Description,
                model.Status,
                model.Tags,
                model.WorkspaceId,
                model.SessionId,
                model.CreatedAt,
                model.UpdatedAt
            )).ToArray();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting all backlogs.");
            throw;
        }
    }

    public async Task<BacklogEntity[]> GetByStatusAsync(BacklogStatus status, CancellationToken cancellationToken)
    {
        try
        {
            var models = await context.Backlogs
                .AsNoTracking()
                .Where(x => x.Status == status)
                .OrderByDescending(x => x.CreatedAt)
                .ToArrayAsync(cancellationToken);

            return models.Select(static model => new BacklogEntity(
                model.Id,
                model.Title,
                model.Description,
                model.Status,
                model.Tags,
                model.WorkspaceId,
                model.SessionId,
                model.CreatedAt,
                model.UpdatedAt
            )).ToArray();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting backlogs by status {Status}.", status);
            throw;
        }
    }

    public async Task<BacklogEntity[]> GetByWorkspaceAsync(int workspaceId, CancellationToken cancellationToken)
    {
        try
        {
            var models = await context.Backlogs
                .AsNoTracking()
                .Where(x => x.WorkspaceId == workspaceId)
                .OrderByDescending(x => x.CreatedAt)
                .ToArrayAsync(cancellationToken);

            return models.Select(static model => new BacklogEntity(
                model.Id,
                model.Title,
                model.Description,
                model.Status,
                model.Tags,
                model.WorkspaceId,
                model.SessionId,
                model.CreatedAt,
                model.UpdatedAt
            )).ToArray();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting backlogs for workspace {WorkspaceId}.", workspaceId);
            throw;
        }
    }

    public async Task<bool> UpdateAsync(BacklogEntity backlog, CancellationToken cancellationToken)
    {
        try
        {
            var model = await context.Backlogs
                .FirstOrDefaultAsync(x => x.Id == backlog.Id, cancellationToken);

            if (model is null)
                return false;

            model.Title = backlog.Title;
            model.Description = backlog.Description;
            model.Status = backlog.Status;
            model.Tags = backlog.Tags;
            model.WorkspaceId = backlog.WorkspaceId;
            model.SessionId = backlog.SessionId;
            model.UpdatedAt = backlog.UpdatedAt;

            await context.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while updating backlog {BacklogId}.", backlog.Id);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        try
        {
            var model = await context.Backlogs
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (model is null)
                return false;

            context.Backlogs.Remove(model);
            await context.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while deleting backlog {BacklogId}.", id);
            throw;
        }
    }
}