import {
  FileIcon,
  FolderIcon,
  FileTextIcon,
  CodeIcon,
  ImageIcon,
  FileJsonIcon,
  SettingsIcon,
  DatabaseIcon,
  PackageIcon,
  GlobeIcon,
  CpuIcon,
  BracesIcon,
  PaletteIcon,
  TerminalIcon,
  BookOpenIcon,
  LockIcon,
  GitBranchIcon,
  EyeIcon,
  WrenchIcon,
  ZapIcon
} from 'lucide-react';

interface FileIconProps {
  fileName: string;
  isFolder?: boolean;
  size?: number;
  className?: string;
}

export default function FileIconComponent({ 
  fileName, 
  isFolder = false, 
  size = 16, 
  className = '' 
}: FileIconProps) {
  if (isFolder) {
    return <FolderIcon size={size} className={className} />;
  }

  const extension = fileName.split('.').pop()?.toLowerCase();
  const name = fileName.toLowerCase();

  // Get appropriate icon based on file extension or name
  const getFileIcon = () => {
    // Special files
    if (name === 'package.json' || name === 'package-lock.json') {
      return <PackageIcon size={size} className={className} />;
    }
    if (name === 'dockerfile' || name === '.dockerignore') {
      return <CpuIcon size={size} className={className} />;
    }
    if (name === 'readme.md' || name === 'readme.txt') {
      return <BookOpenIcon size={size} className={className} />;
    }
    if (name === '.gitignore' || name === '.gitattributes') {
      return <GitBranchIcon size={size} className={className} />;
    }
    if (name === '.env' || name.startsWith('.env.')) {
      return <LockIcon size={size} className={className} />;
    }

    // Extensions
    switch (extension) {
      // Code files
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'vue':
      case 'svelte':
        return <CodeIcon size={size} className={className} />;
      
      case 'html':
      case 'htm':
        return <GlobeIcon size={size} className={className} />;
      
      case 'css':
      case 'scss':
      case 'sass':
      case 'less':
        return <PaletteIcon size={size} className={className} />;
      
      case 'json':
      case 'jsonc':
        return <FileJsonIcon size={size} className={className} />;
      
      // Config files
      case 'xml':
      case 'yml':
      case 'yaml':
      case 'toml':
      case 'ini':
      case 'conf':
      case 'config':
        return <SettingsIcon size={size} className={className} />;
      
      // Database
      case 'sql':
      case 'db':
      case 'sqlite':
        return <DatabaseIcon size={size} className={className} />;
      
      // Images
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
      case 'ico':
        return <ImageIcon size={size} className={className} />;
      
      // Text/Documents
      case 'md':
      case 'txt':
      case 'rtf':
        return <FileTextIcon size={size} className={className} />;
      
      // Shell/Scripts
      case 'sh':
      case 'bash':
      case 'zsh':
      case 'fish':
      case 'ps1':
      case 'bat':
      case 'cmd':
        return <TerminalIcon size={size} className={className} />;
      
      // Other languages
      case 'py':
      case 'rb':
      case 'go':
      case 'rs':
      case 'cpp':
      case 'c':
      case 'h':
      case 'java':
      case 'kt':
      case 'swift':
      case 'php':
        return <CodeIcon size={size} className={className} />;
      
      default:
        return <FileIcon size={size} className={className} />;
    }
  };

  return getFileIcon();
}