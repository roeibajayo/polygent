using Microsoft.Extensions.FileSystemGlobbing;
using Microsoft.Extensions.FileSystemGlobbing.Abstractions;
using Microsoft.Extensions.Logging;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;

namespace Polygent.Logic.Services;

internal sealed class FileSyncService(
    ILogger<FileSyncService> logger)
    : ISingletonService
{
    /// <summary>
    /// Syncs files from source directory to destination directory, respecting .gitignore rules
    /// </summary>
    /// <param name="destinationPath">The destination directory to sync files to</param>
    /// <param name="sourcePath">The source directory to sync files from</param>
    /// <param name="deleteExtraFiles">If true, deletes files in destination that don't exist in source</param>
    public void SyncDirectories(string destinationPath, string sourcePath, bool deleteExtraFiles = true)
    {
        if (!Directory.Exists(sourcePath))
            throw new DirectoryNotFoundException($"Source directory not found: {sourcePath}");

        if (!Directory.Exists(destinationPath))
            Directory.CreateDirectory(destinationPath);

        // Normalize paths for cross-platform compatibility
        sourcePath = Path.GetFullPath(sourcePath);
        destinationPath = Path.GetFullPath(destinationPath);

        // Load .gitignore patterns if exists
        var gitignorePath = Path.Combine(sourcePath, ".gitignore");
        var ignoreMatcher = CreateIgnoreMatcher(gitignorePath, sourcePath);

        // Get all files from source, filtering by .gitignore
        var sourceFiles = GetFilteredFiles(sourcePath, ignoreMatcher);

        // Copy or update files
        foreach (var sourceFile in sourceFiles)
        {
            var relativePath = Path.GetRelativePath(sourcePath, sourceFile);
            var destFile = Path.Combine(destinationPath, relativePath);

            CopyFileIfNeeded(sourceFile, destFile);
        }

        // Optionally delete extra files in destination
        if (deleteExtraFiles)
        {
            DeleteExtraFiles(sourcePath, destinationPath, ignoreMatcher);
        }
    }

    private static Matcher CreateIgnoreMatcher(string gitignorePath, string basePath)
    {
        var matcher = new Matcher();

        // Always ignore .git directory
        matcher.AddExclude(".git/**");

        if (!File.Exists(gitignorePath))
            return matcher;

        var lines = File.ReadAllLines(gitignorePath);

        foreach (var line in lines)
        {
            var pattern = line.Trim();

            // Skip empty lines and comments
            if (string.IsNullOrWhiteSpace(pattern) || pattern.StartsWith('#'))
                continue;

            // Handle negation patterns (starting with !)
            if (pattern.StartsWith('!'))
            {
                var includePattern = pattern[1..];
                matcher.AddInclude(ConvertGitignorePattern(includePattern));
            }
            else
            {
                matcher.AddExclude(ConvertGitignorePattern(pattern));
            }
        }

        return matcher;
    }

    private static string ConvertGitignorePattern(string gitignorePattern)
    {
        var pattern = gitignorePattern;

        // Handle directory-only patterns (ending with /)
        if (pattern.EndsWith('/'))
        {
            pattern = pattern.TrimEnd('/') + "/**";
        }
        // Handle patterns that should match anywhere
        else if (!pattern.Contains('/'))
        {
            pattern = "**/" + pattern;
        }
        // Handle absolute paths (starting with /)
        else if (pattern.StartsWith('/'))
        {
            pattern = pattern[1..];
        }

        return pattern;
    }

    private static List<string> GetFilteredFiles(string directory, Matcher ignoreMatcher)
    {
        var files = new List<string>();

        // Use streaming approach - enumerate files and filter incrementally
        foreach (var filePath in Directory.EnumerateFiles(directory, "*", SearchOption.AllDirectories))
        {
            var relativePath = Path.GetRelativePath(directory, filePath);

            // Quick check: skip if matches ignore patterns
            if (!IsFileIgnored(filePath, relativePath, ignoreMatcher))
            {
                files.Add(filePath);
            }
        }

        return files;
    }

    private static bool IsFileIgnored(string filePath, string relativePath, Matcher ignoreMatcher)
    {
        if (filePath.EndsWith(Path.DirectorySeparatorChar + ".git"))
            return true;

        if (filePath.EndsWith(Path.DirectorySeparatorChar + ".gitignore"))
            return true;

        // Create minimal directory info just for this file
        var mockDirInfo = new InMemoryDirectoryInfo(string.Empty, [relativePath], true);
        var result = ignoreMatcher.Execute(mockDirInfo);
        return result.HasMatches;
    }


    private void CopyFileIfNeeded(string sourceFile, string destFile)
    {
        try
        {
            var sourceInfo = new FileInfo(sourceFile);
            var destInfo = new FileInfo(destFile);

            // Check if file needs to be copied
            bool shouldCopy = !destInfo.Exists ||
                             sourceInfo.LastWriteTimeUtc > destInfo.LastWriteTimeUtc ||
                             sourceInfo.Length != destInfo.Length;

            if (shouldCopy)
            {
                // Create destination directory if it doesn't exist
                var destDir = Path.GetDirectoryName(destFile);
                if (!Directory.Exists(destDir))
                    Directory.CreateDirectory(destDir!);

                File.Copy(sourceFile, destFile, true);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error copying file from {Source} to {Destination}", sourceFile, destFile);
        }
    }

    private void DeleteExtraFiles(string sourcePath, string destPath, Matcher ignoreMatcher)
    {
        var sourceFiles = GetFilteredFiles(sourcePath, ignoreMatcher)
            .Select(f => Path.GetRelativePath(sourcePath, f))
            .ToHashSet();

        var destFiles = Directory.GetFiles(destPath, "*", SearchOption.AllDirectories);

        foreach (var destFile in destFiles)
        {
            var relativePath = Path.GetRelativePath(destPath, destFile);

            if (relativePath.EndsWith(".git")
                || relativePath.Contains(Path.DirectorySeparatorChar + ".git" + Path.DirectorySeparatorChar)
                || relativePath.StartsWith(".git" + Path.DirectorySeparatorChar))
            {
                continue;
            }

            if (!sourceFiles.Contains(relativePath))
            {
                try
                {
                    File.Delete(destFile);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error deleting file: {FilePath}", destFile);
                }
            }
        }

        // Clean up empty directories
        CleanEmptyDirectories(destPath);
    }

    private static void CleanEmptyDirectories(string directory)
    {
        foreach (var dir in Directory.GetDirectories(directory, "*", SearchOption.AllDirectories)
                     .OrderByDescending(d => d.Length))
        {
            try
            {
                if (!Directory.EnumerateFileSystemEntries(dir).Any())
                {
                    Directory.Delete(dir);
                }
            }
            catch
            {
                // Ignore errors when deleting directories
            }
        }
    }
}

// Custom implementation of InMemoryDirectoryInfo for pattern matching
file class InMemoryDirectoryInfo(string rootPath, IEnumerable<string> files, bool includeFiles = true)
    : DirectoryInfoBase
{
    public override string Name { get; } = Path.GetFileName(rootPath);
    public override string FullName { get; } = rootPath;
    public override DirectoryInfoBase ParentDirectory { get; } = null!;

    public override IEnumerable<FileSystemInfoBase> EnumerateFileSystemInfos()
    {
        var directories = new HashSet<string>();

        foreach (var file in files)
        {
            var parts = file.Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

            // Add all parent directories
            for (int i = 0; i < parts.Length - 1; i++)
            {
                var dirPath = string.Join(Path.DirectorySeparatorChar.ToString(), parts.Take(i + 1));
                directories.Add(dirPath);
            }

            // Add the file if we're including files
            if (includeFiles)
            {
                yield return new InMemoryFileInfo(file, Path.GetFileName(file));
            }
        }

        // Return unique directories
        foreach (var dir in directories.OrderBy(d => d))
        {
            var dirName = Path.GetFileName(dir);
            if (!string.IsNullOrEmpty(dirName))
            {
                yield return new InMemoryDirectoryInfo(
                    Path.Combine(rootPath, dir),
                    files.Where(f => f.StartsWith(dir + Path.DirectorySeparatorChar)),
                    false);
            }
        }
    }

    public override DirectoryInfoBase GetDirectory(string name)
    {
        var path = Path.Combine(FullName, name);
        return new InMemoryDirectoryInfo(
            path,
            files.Where(f => f.StartsWith(name + Path.DirectorySeparatorChar)),
            includeFiles);
    }

    public override FileInfoBase GetFile(string name)
    {
        return new InMemoryFileInfo(Path.Combine(FullName, name), name);
    }
}

file class InMemoryFileInfo(string fullName, string name) : FileInfoBase
{
    public override string Name { get; } = name;
    public override string FullName { get; } = fullName;
    public override DirectoryInfoBase ParentDirectory { get; } = null!;
}