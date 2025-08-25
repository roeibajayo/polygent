using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Polygent.Logic.Context;
using Polygent.Logic.Interfaces;
using Polygent.Logic.Models;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;

namespace Polygent.Logic.Repositories;

internal sealed class TaskRepository(ILogger<TaskRepository> logger, PolygentContext context) 
    : ITaskRepository, IScopedService<ITaskRepository>
{
    public async Task<int> CreateAsync(TaskEntity task, CancellationToken cancellationToken)
    {
        try
        {
            var model = new TaskModel
            {
                Id = task.Id,
                WorkspaceId = task.WorkspaceId,
                Name = task.Name,
                Type = task.Type,
                WorkingDirectory = task.WorkingDirectory,
                ScriptType = task.ScriptType,
                ScriptContent = task.ScriptContent,
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt
            };

            context.Tasks.Add(model);
            await context.SaveChangesAsync(cancellationToken);
            return model.Id;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while creating task {TaskName}.", task.Name);
            throw;
        }
    }

    public async Task<TaskEntity?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        try
        {
            var model = await context.Tasks
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (model is null)
                return null;

            return new TaskEntity(
                model.Id,
                model.WorkspaceId,
                model.Name,
                model.Type,
                model.WorkingDirectory,
                model.ScriptType,
                model.ScriptContent,
                model.CreatedAt,
                model.UpdatedAt
            );
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting task by ID {TaskId}.", id);
            throw;
        }
    }

    public async Task<TaskEntity[]> GetByWorkspaceIdAsync(int workspaceId, CancellationToken cancellationToken)
    {
        try
        {
            var models = await context.Tasks
                .AsNoTracking()
                .Where(x => x.WorkspaceId == workspaceId)
                .OrderBy(x => x.Name)
                .ToArrayAsync(cancellationToken);

            return models.Select(static model => new TaskEntity(
                model.Id,
                model.WorkspaceId,
                model.Name,
                model.Type,
                model.WorkingDirectory,
                model.ScriptType,
                model.ScriptContent,
                model.CreatedAt,
                model.UpdatedAt
            )).ToArray();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting tasks for workspace {WorkspaceId}.", workspaceId);
            throw;
        }
    }

    public async Task<TaskEntity[]> GetByTypeAsync(TaskType type, CancellationToken cancellationToken)
    {
        try
        {
            var models = await context.Tasks
                .AsNoTracking()
                .Where(x => x.Type == type)
                .OrderBy(x => x.Name)
                .ToArrayAsync(cancellationToken);

            return models.Select(static model => new TaskEntity(
                model.Id,
                model.WorkspaceId,
                model.Name,
                model.Type,
                model.WorkingDirectory,
                model.ScriptType,
                model.ScriptContent,
                model.CreatedAt,
                model.UpdatedAt
            )).ToArray();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting tasks by type {Type}.", type);
            throw;
        }
    }

    public async Task<bool> UpdateAsync(TaskEntity task, CancellationToken cancellationToken)
    {
        try
        {
            var model = await context.Tasks
                .FirstOrDefaultAsync(x => x.Id == task.Id, cancellationToken);

            if (model is null)
                return false;

            model.Name = task.Name;
            model.Type = task.Type;
            model.WorkingDirectory = task.WorkingDirectory;
            model.ScriptType = task.ScriptType;
            model.ScriptContent = task.ScriptContent;
            model.UpdatedAt = task.UpdatedAt;

            await context.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while updating task {TaskId}.", task.Id);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        try
        {
            var model = await context.Tasks
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (model is null)
                return false;

            context.Tasks.Remove(model);
            await context.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while deleting task {TaskId}.", id);
            throw;
        }
    }
}