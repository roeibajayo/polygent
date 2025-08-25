namespace Polygent.Logic.Interfaces;

public interface IFileSystemService
{
    Task<bool> CreateDirectoryAsync(string directoryPath, CancellationToken cancellationToken);
    Task<bool> DeleteDirectoryAsync(string directoryPath, CancellationToken cancellationToken);
    Task<bool> CopyDirectoryAsync(string sourceDirectory, string destinationDirectory, CancellationToken cancellationToken);
    Task<string?> ReadFileAsync(string filePath, CancellationToken cancellationToken);
    Task<bool> WriteFileAsync(string filePath, string content, CancellationToken cancellationToken);
    Task<bool> DeleteFileAsync(string filePath, CancellationToken cancellationToken);
    Task<bool> FileExistsAsync(string filePath, CancellationToken cancellationToken);
    Task<bool> DirectoryExistsAsync(string directoryPath, CancellationToken cancellationToken);
    Task<string[]> GetDirectoryFilesAsync(string directoryPath, CancellationToken cancellationToken);
}