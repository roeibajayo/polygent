namespace Polygent.Dtos;

public sealed record StartupDto(
    WorkspaceDto[] Workspaces,
    EnvironmentDto[] Environments,
    EditorDto[] AvailableEditors
);