using Microsoft.EntityFrameworkCore;
using Polygent.Logic.Models;

namespace Polygent.Logic.Context;

public sealed class PolygentContext(DbContextOptions<PolygentContext> options) : DbContext(options)
{
    public DbSet<WorkspaceModel> Workspaces { get; set; } = null!;
    public DbSet<WorkspaceEnvironmentVariableModel> WorkspaceEnvironmentVariables { get; set; } = null!;
    public DbSet<SessionModel> Sessions { get; set; } = null!;
    public DbSet<AgentModel> Agents { get; set; } = null!;
    public DbSet<BacklogModel> Backlogs { get; set; } = null!;
    public DbSet<MCPModel> MCPs { get; set; } = null!;
    public DbSet<EnvironmentModel> Environments { get; set; } = null!;
    public DbSet<TaskModel> Tasks { get; set; } = null!;
    public DbSet<MessageModel> Messages { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure relationships
        modelBuilder.Entity<SessionModel>()
            .HasOne(x => x.Workspace)
            .WithMany(x => x.Sessions)
            .HasForeignKey(x => x.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SessionModel>()
            .HasOne(x => x.Agent)
            .WithMany(x => x.Sessions)
            .HasForeignKey(x => x.AgentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<EnvironmentModel>()
            .HasOne(x => x.Workspace)
            .WithMany(x => x.Environments)
            .HasForeignKey(x => x.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TaskModel>()
            .HasOne(x => x.Workspace)
            .WithMany(x => x.Tasks)
            .HasForeignKey(x => x.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MessageModel>()
            .HasOne(x => x.Session)
            .WithMany(x => x.Messages)
            .HasForeignKey(x => x.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MessageModel>()
            .HasOne(x => x.ParentMessage)
            .WithMany(x => x.Replies)
            .HasForeignKey(x => x.ParentMessageId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<BacklogModel>()
            .HasOne(x => x.Workspace)
            .WithMany(x => x.Backlogs)
            .HasForeignKey(x => x.WorkspaceId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<BacklogModel>()
            .HasOne(x => x.Session)
            .WithMany(x => x.Backlogs)
            .HasForeignKey(x => x.SessionId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<WorkspaceEnvironmentVariableModel>()
            .HasOne(x => x.Workspace)
            .WithMany(x => x.EnvironmentVariables)
            .HasForeignKey(x => x.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure indexes
        modelBuilder.Entity<WorkspaceModel>()
            .HasIndex(x => x.Name)
            .IsUnique();

        modelBuilder.Entity<SessionModel>()
            .HasIndex(x => x.Status);

        modelBuilder.Entity<AgentModel>()
            .HasIndex(x => x.Name)
            .IsUnique();

        modelBuilder.Entity<BacklogModel>()
            .HasIndex(x => x.Status);

        modelBuilder.Entity<MCPModel>()
            .HasIndex(x => x.Name)
            .IsUnique();

        modelBuilder.Entity<EnvironmentModel>()
            .HasIndex(x => new { x.WorkspaceId, x.Name })
            .IsUnique();

        modelBuilder.Entity<TaskModel>()
            .HasIndex(x => new { x.WorkspaceId, x.Name })
            .IsUnique();

        modelBuilder.Entity<MessageModel>()
            .HasIndex(x => new { x.SessionId, x.CreatedAt });

        modelBuilder.Entity<WorkspaceEnvironmentVariableModel>()
            .HasIndex(x => new { x.WorkspaceId, x.Key })
            .IsUnique();
    }
}