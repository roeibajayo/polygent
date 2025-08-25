namespace Polygent.Dtos;

public sealed record SessionFileDto(
    string RelativePath,
    string FileName,
    string Extension,
    DateTime LastModified,
    long Size,
    bool IsDirectory = false
);