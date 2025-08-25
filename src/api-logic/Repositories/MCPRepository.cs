using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Polygent.Logic.Context;
using Polygent.Logic.Interfaces;
using Polygent.Logic.Models;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;

namespace Polygent.Logic.Repositories;

internal sealed class MCPRepository(ILogger<MCPRepository> logger, PolygentContext context) 
    : IMCPRepository, IScopedService<IMCPRepository>
{
    public async Task<int> CreateAsync(MCPEntity mcp, CancellationToken cancellationToken)
    {
        try
        {
            var model = new MCPModel
            {
                Id = mcp.Id,
                Name = mcp.Name,
                Description = mcp.Description,
                Type = mcp.Type,
                Path = mcp.Path,
                CreatedAt = mcp.CreatedAt,
                UpdatedAt = mcp.UpdatedAt
            };

            context.MCPs.Add(model);
            await context.SaveChangesAsync(cancellationToken);
            return model.Id;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while creating MCP {MCPName}.", mcp.Name);
            throw;
        }
    }

    public async Task<MCPEntity?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        try
        {
            var model = await context.MCPs
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (model is null)
                return null;

            return new MCPEntity(
                model.Id,
                model.Name,
                model.Description,
                model.Type,
                model.Path,
                model.CreatedAt,
                model.UpdatedAt
            );
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting MCP by ID {MCPId}.", id);
            throw;
        }
    }

    public async Task<MCPEntity[]> GetAllAsync(CancellationToken cancellationToken)
    {
        try
        {
            var models = await context.MCPs
                .AsNoTracking()
                .OrderBy(x => x.Name)
                .ToArrayAsync(cancellationToken);

            return models.Select(static model => new MCPEntity(
                model.Id,
                model.Name,
                model.Description,
                model.Type,
                model.Path,
                model.CreatedAt,
                model.UpdatedAt
            )).ToArray();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting all MCPs.");
            throw;
        }
    }

    public async Task<MCPEntity[]> GetByTypeAsync(MCPType type, CancellationToken cancellationToken)
    {
        try
        {
            var models = await context.MCPs
                .AsNoTracking()
                .Where(x => x.Type == type)
                .OrderBy(x => x.Name)
                .ToArrayAsync(cancellationToken);

            return models.Select(static model => new MCPEntity(
                model.Id,
                model.Name,
                model.Description,
                model.Type,
                model.Path,
                model.CreatedAt,
                model.UpdatedAt
            )).ToArray();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting MCPs by type {Type}.", type);
            throw;
        }
    }

    public async Task<bool> UpdateAsync(MCPEntity mcp, CancellationToken cancellationToken)
    {
        try
        {
            var model = await context.MCPs
                .FirstOrDefaultAsync(x => x.Id == mcp.Id, cancellationToken);

            if (model is null)
                return false;

            model.Name = mcp.Name;
            model.Description = mcp.Description;
            model.Type = mcp.Type;
            model.Path = mcp.Path;
            model.UpdatedAt = mcp.UpdatedAt;

            await context.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while updating MCP {MCPId}.", mcp.Id);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        try
        {
            var model = await context.MCPs
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (model is null)
                return false;

            context.MCPs.Remove(model);
            await context.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while deleting MCP {MCPId}.", id);
            throw;
        }
    }
}