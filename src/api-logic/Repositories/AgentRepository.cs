using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Polygent.Logic.Context;
using Polygent.Logic.Interfaces;
using Polygent.Logic.Models;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;

namespace Polygent.Logic.Repositories;

internal sealed class AgentRepository(ILogger<AgentRepository> logger, PolygentContext context) 
    : IAgentRepository, IScopedService<IAgentRepository>
{
    public async Task<int> CreateAsync(AgentEntity agent, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Creating agent {AgentName}.", agent.Name);
            
            var model = new AgentModel
            {
                Id = agent.Id,
                Name = agent.Name,
                RoleName = agent.RoleName,
                Model = agent.Model,
                SystemPrompt = agent.SystemPrompt,
                MCPIds = agent.MCPIds,
                CreatedAt = agent.CreatedAt,
                UpdatedAt = agent.UpdatedAt
            };

            context.Agents.Add(model);
            await context.SaveChangesAsync(cancellationToken);
            
            logger.LogInformation("Successfully created agent {AgentName} with ID {AgentId}.", agent.Name, model.Id);
            return model.Id;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while creating agent {AgentName}.", agent.Name);
            throw;
        }
    }

    public async Task<AgentEntity?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        try
        {
            var model = await context.Agents
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (model is null)
                return null;

            return new AgentEntity(
                model.Id,
                model.Name,
                model.RoleName,
                model.Model,
                model.SystemPrompt,
                model.MCPIds,
                model.CreatedAt,
                model.UpdatedAt
            );
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting agent by ID {AgentId}.", id);
            throw;
        }
    }

    public async Task<AgentEntity[]> GetAllAsync(CancellationToken cancellationToken)
    {
        try
        {
            var models = await context.Agents
                .AsNoTracking()
                .OrderBy(x => x.Name)
                .ToArrayAsync(cancellationToken);

            return models.Select(static model => new AgentEntity(
                model.Id,
                model.Name,
                model.RoleName,
                model.Model,
                model.SystemPrompt,
                model.MCPIds,
                model.CreatedAt,
                model.UpdatedAt
            )).ToArray();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting all agents.");
            throw;
        }
    }

    public async Task<bool> UpdateAsync(AgentEntity agent, CancellationToken cancellationToken)
    {
        try
        {
            var model = await context.Agents
                .FirstOrDefaultAsync(x => x.Id == agent.Id, cancellationToken);

            if (model is null)
                return false;

            model.Name = agent.Name;
            model.RoleName = agent.RoleName;
            model.Model = agent.Model;
            model.SystemPrompt = agent.SystemPrompt;
            model.MCPIds = agent.MCPIds;
            model.UpdatedAt = agent.UpdatedAt;

            await context.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while updating agent {AgentId}.", agent.Id);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        try
        {
            var model = await context.Agents
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (model is null)
                return false;

            context.Agents.Remove(model);
            await context.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while deleting agent {AgentId}.", id);
            throw;
        }
    }

    public async Task<AgentEntity[]> GetByRoleAsync(string roleName, CancellationToken cancellationToken)
    {
        try
        {
            var models = await context.Agents
                .AsNoTracking()
                .Where(x => x.RoleName == roleName)
                .OrderBy(x => x.Name)
                .ToArrayAsync(cancellationToken);

            return models.Select(static model => new AgentEntity(
                model.Id,
                model.Name,
                model.RoleName,
                model.Model,
                model.SystemPrompt,
                model.MCPIds,
                model.CreatedAt,
                model.UpdatedAt
            )).ToArray();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting agents by role {RoleName}.", roleName);
            throw;
        }
    }
}