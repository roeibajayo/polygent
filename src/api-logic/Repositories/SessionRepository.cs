using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Polygent.Logic.Context;
using Polygent.Logic.Interfaces;
using Polygent.Logic.Models;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;

namespace Polygent.Logic.Repositories;

internal sealed class SessionRepository(ILogger<SessionRepository> logger, PolygentContext context) 
    : ISessionRepository, IScopedService<ISessionRepository>
{
    public async Task<int> CreateAsync(SessionEntity session, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Creating session for workspace {WorkspaceId}.", session.WorkspaceId);
            
            // Validate that the workspace exists
            var workspaceExists = await context.Workspaces
                .AsNoTracking()
                .AnyAsync(w => w.Id == session.WorkspaceId, cancellationToken);
            
            if (!workspaceExists)
            {
                throw new InvalidOperationException($"Workspace {session.WorkspaceId} does not exist. Cannot create session.");
            }
            
            // Validate that the agent exists
            var agentExists = await context.Agents
                .AsNoTracking()
                .AnyAsync(a => a.Id == session.AgentId, cancellationToken);
            
            if (!agentExists)
            {
                throw new InvalidOperationException($"Agent {session.AgentId} does not exist. Cannot create session.");
            }
            
            var model = new SessionModel
            {
                Id = session.Id,
                WorkspaceId = session.WorkspaceId,
                Status = session.Status,
                StarterGitBranch = session.StarterGitBranch,
                AgentId = session.AgentId,
                ProviderSessionId = session.ProviderSessionId,
                HasUnreadMessage = session.HasUnreadMessage,
                Name = session.Name,
                CreatedAt = session.CreatedAt,
                UpdatedAt = session.UpdatedAt
            };

            context.Sessions.Add(model);
            await context.SaveChangesAsync(cancellationToken);
            
            logger.LogInformation("Successfully created session {SessionId}.", model.Id);
            return model.Id;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while creating session for workspace {WorkspaceId}.", session.WorkspaceId);
            throw;
        }
    }

    public async Task<SessionEntity?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        try
        {            
            var model = await context.Sessions
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (model is null)
            {
                logger.LogInformation("Session with ID {SessionId} not found.", id);
                return null;
            }

            var entity = new SessionEntity(
                model.Id,
                model.WorkspaceId,
                model.Status,
                model.StarterGitBranch,
                model.AgentId,
                model.ProviderSessionId,
                model.HasUnreadMessage,
                model.Name,
                model.CreatedAt,
                model.UpdatedAt
            );

            return entity;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting session by ID {SessionId}.", id);
            throw;
        }
    }

    public async Task<SessionEntity[]> GetByWorkspaceIdAsync(int workspaceId, CancellationToken cancellationToken)
    {
        try
        {
            var models = await context.Sessions
                .AsNoTracking()
                .Where(x => x.WorkspaceId == workspaceId)
                .OrderByDescending(x => x.CreatedAt)
                .ToArrayAsync(cancellationToken);

            var entities = models.Select(static model => new SessionEntity(
                model.Id,
                model.WorkspaceId,
                model.Status,
                model.StarterGitBranch,
                model.AgentId,
                model.ProviderSessionId,
                model.HasUnreadMessage,
                model.Name,
                model.CreatedAt,
                model.UpdatedAt
            )).ToArray();

            return entities;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting sessions for workspace {WorkspaceId}.", workspaceId);
            throw;
        }
    }

    public async Task<bool> UpdateAsync(SessionEntity session, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Updating session {SessionId}.", session.Id);
            
            var model = await context.Sessions
                .FirstOrDefaultAsync(x => x.Id == session.Id, cancellationToken);

            if (model is null)
            {
                logger.LogWarning("Session with ID {SessionId} not found for update.", session.Id);
                return false;
            }

            model.Status = session.Status;
            model.StarterGitBranch = session.StarterGitBranch;
            model.AgentId = session.AgentId;
            model.ProviderSessionId = session.ProviderSessionId;
            model.HasUnreadMessage = session.HasUnreadMessage;
            model.Name = session.Name;
            model.UpdatedAt = session.UpdatedAt;

            await context.SaveChangesAsync(cancellationToken);
            
            logger.LogInformation("Successfully updated session {SessionId}.", session.Id);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while updating session {SessionId}.", session.Id);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Deleting session {SessionId}.", id);
            
            var model = await context.Sessions
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (model is null)
            {
                logger.LogWarning("Session with ID {SessionId} not found for deletion.", id);
                return false;
            }

            context.Sessions.Remove(model);
            await context.SaveChangesAsync(cancellationToken);
            
            logger.LogInformation("Successfully deleted session {SessionId}.", id);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while deleting session {SessionId}.", id);
            throw;
        }
    }

    public async Task<SessionEntity[]> GetActiveSessionsAsync(CancellationToken cancellationToken)
    {
        try
        {
            var models = await context.Sessions
                .AsNoTracking()
                .Where(x => x.Status == SessionStatus.InProgress || x.Status == SessionStatus.Waiting)
                .OrderByDescending(x => x.UpdatedAt)
                .ToArrayAsync(cancellationToken);

            var entities = models.Select(static model => new SessionEntity(
                model.Id,
                model.WorkspaceId,
                model.Status,
                model.StarterGitBranch,
                model.AgentId,
                model.ProviderSessionId,
                model.HasUnreadMessage,
                model.Name,
                model.CreatedAt,
                model.UpdatedAt
            )).ToArray();

            return entities;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting active sessions.");
            throw;
        }
    }
}