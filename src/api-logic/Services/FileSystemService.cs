using Microsoft.Extensions.Logging;
using Polygent.Logic.Interfaces;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;

namespace Polygent.Logic.Services;

internal sealed class FileSystemService(ILogger<FileSystemService> logger) 
    : IFileSystemService, ISingletonService<IFileSystemService>
{
    public async Task<bool> CreateDirectoryAsync(string directoryPath, CancellationToken cancellationToken)
    {
        try
        {
            if (Directory.Exists(directoryPath))
            {
                logger.LogInformation("Directory {DirectoryPath} already exists.", directoryPath);
                return true;
            }

            Directory.CreateDirectory(directoryPath);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while creating directory {DirectoryPath}.", directoryPath);
            return false;
        }
    }

    public async Task<bool> DeleteDirectoryAsync(string directoryPath, CancellationToken cancellationToken)
    {
        try
        {
            if (!Directory.Exists(directoryPath))
            {
                logger.LogInformation("Directory {DirectoryPath} does not exist.", directoryPath);
                return true;
            }

            Directory.Delete(directoryPath, recursive: true);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while deleting directory {DirectoryPath}.", directoryPath);
            return false;
        }
    }

    public async Task<bool> CopyDirectoryAsync(string sourceDirectory, string destinationDirectory, CancellationToken cancellationToken)
    {
        try
        {
            if (!Directory.Exists(sourceDirectory))
            {
                logger.LogError("Source directory {SourceDirectory} does not exist.", sourceDirectory);
                return false;
            }

            if (!Directory.Exists(destinationDirectory))
            {
                Directory.CreateDirectory(destinationDirectory);
            }

            var sourceInfo = new DirectoryInfo(sourceDirectory);
            
            foreach (var file in sourceInfo.GetFiles())
            {
                var destFilePath = Path.Combine(destinationDirectory, file.Name);
                file.CopyTo(destFilePath, overwrite: true);
            }

            foreach (var directory in sourceInfo.GetDirectories())
            {
                var destDirPath = Path.Combine(destinationDirectory, directory.Name);
                await CopyDirectoryAsync(directory.FullName, destDirPath, cancellationToken);
            }
            
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while copying directory from {SourceDirectory} to {DestinationDirectory}.", sourceDirectory, destinationDirectory);
            return false;
        }
    }

    public async Task<string?> ReadFileAsync(string filePath, CancellationToken cancellationToken)
    {
        try
        {            
            if (!File.Exists(filePath))
            {
                logger.LogWarning("File {FilePath} does not exist.", filePath);
                return null;
            }

            var content = await File.ReadAllTextAsync(filePath, cancellationToken);
            return content;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while reading file {FilePath}.", filePath);
            return null;
        }
    }

    public async Task<bool> WriteFileAsync(string filePath, string content, CancellationToken cancellationToken)
    {
        try
        {            
            var directoryPath = Path.GetDirectoryName(filePath);
            if (!string.IsNullOrEmpty(directoryPath) && !Directory.Exists(directoryPath))
            {
                Directory.CreateDirectory(directoryPath);
            }

            await File.WriteAllTextAsync(filePath, content, cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while writing to file {FilePath}.", filePath);
            return false;
        }
    }

    public async Task<bool> DeleteFileAsync(string filePath, CancellationToken cancellationToken)
    {
        try
        {
            if (!File.Exists(filePath))
            {
                logger.LogInformation("File {FilePath} does not exist.", filePath);
                return true;
            }

            File.Delete(filePath);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while deleting file {FilePath}.", filePath);
            return false;
        }
    }

    public async Task<bool> FileExistsAsync(string filePath, CancellationToken cancellationToken)
    {
        try
        {
            return File.Exists(filePath);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while checking if file {FilePath} exists.", filePath);
            return false;
        }
    }

    public async Task<bool> DirectoryExistsAsync(string directoryPath, CancellationToken cancellationToken)
    {
        try
        {
            return Directory.Exists(directoryPath);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while checking if directory {DirectoryPath} exists.", directoryPath);
            return false;
        }
    }

    public async Task<string[]> GetDirectoryFilesAsync(string directoryPath, CancellationToken cancellationToken)
    {
        try
        {
            if (!Directory.Exists(directoryPath))
            {
                logger.LogWarning("Directory {DirectoryPath} does not exist.", directoryPath);
                return [];
            }

            var files = Directory.GetFiles(directoryPath, "*", SearchOption.AllDirectories);
            
            return files;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting files in directory {DirectoryPath}.", directoryPath);
            return [];
        }
    }
}