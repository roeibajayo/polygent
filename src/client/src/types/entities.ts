export enum BacklogStatus {
  InMind = 1,
  Ready = 2,
  InProgress = 3,
  Done = 4,
  Canceled = 5
}

export interface Backlog {
  id: number;
  title: string;
  description: string;
  status: BacklogStatus;
  tags: string[];
  workspaceId?: number;
  sessionId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: number;
  name: string;
  roleName: string;
  model: string;
  systemPrompt: string;
  mcpIds: number[];
  mcps: MCP[];
  createdAt: Date;
  updatedAt: Date;
}

export enum SessionStatus {
  Ready = 1,
  Waiting = 2,
  InProgress = 3,
  Done = 4,
  Canceled = 5
}
export enum MessageType {
  System = 1,
  User = 2,
  Agent = 3,
  Tool = 4
}
export enum MessageStatus {
  Pending = 1,
  Working = 2,
  Done = 3,
  Failed = 4,
  Canceled = 5
}

export interface Message {
  id: number;
  sessionId: number;
  type: MessageType;
  content: string;
  status: MessageStatus;
  metadata?: string;
  parentMessageId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: number;
  workspaceId: number;
  status: SessionStatus;
  starterGitBranch: string;
  agentId: number;
  hasUnreadMessage: boolean;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionFile {
  relativePath: string;
  fileName: string;
  extension: string;
  lastModified: Date;
  size: number;
  isDirectory: boolean;
}

export interface Editor {
  id: string;
  name: string;
  displayName: string;
  executablePath: string;
  isAvailable: boolean;
}

export interface Environment {
  id: number;
  workspaceId: number;
  name: string;
  gitBranch: string;
  url?: string;
  environmentVariables: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskType {
  Build = 1,
  Test = 2,
  Start = 3
}
export enum ScriptType {
  Bash = 1,
  PowerShell = 2,
  NodeJs = 3
}
export enum TaskStatus {
  Pending = 1,
  Running = 2,
  Completed = 3,
  Failed = 4,
  Canceled = 5
}

export interface Task {
  id: number;
  workspaceId: number;
  name: string;
  type: TaskType | null;
  workingDirectory: string;
  scriptType: ScriptType;
  scriptContent: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: number;
  name: string;
  gitRepository: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum MCPType {
  HttpStreaming = 1,
  Sse = 2,
  Stdio = 3
}

export interface MCP {
  id: number;
  name: string;
  description?: string;
  type: MCPType;
  path: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create DTOs
export interface CreateWorkspace {
  name: string;
  gitRepository: string;
}

export interface CreateSession {
  workspaceId: number;
  starterGitBranch: string;
  agentId: number;
  name?: string | null;
}

export interface CreateMessage {
  type: MessageType;
  content: string;
  metadata?: string;
  parentMessageId?: number;
}

export interface SendMessageRequest {
  content: string;
  messageType?: MessageType;
  metadata?: string;
  parentMessageId?: number;
}

export interface CreateAgent {
  name: string;
  roleName: string;
  model: string;
  systemPrompt: string;
  mcpIds: number[];
}

export interface CreateEnvironment {
  name: string;
  gitBranch: string;
  url?: string;
  environmentVariables: Record<string, string>;
}

export interface CreateTask {
  name: string;
  type: TaskType | null;
  workingDirectory: string;
  scriptType: ScriptType;
  scriptContent: string;
}

export interface CreateBacklog {
  title: string;
  description: string;
  status: BacklogStatus;
  tags: string[];
  workspaceId?: number;
  sessionId?: number;
}

export interface CreateMCP {
  name: string;
  description?: string;
  type: MCPType;
  path: string;
}

// Update DTOs
export interface UpdateWorkspace {
  name?: string;
}

export interface UpdateSession {
  status?: SessionStatus;
  starterGitBranch?: string;
  name?: string | null;
}

export interface UpdateMessage {
  content?: string;
  status?: MessageStatus;
  metadata?: string;
}

export interface UpdateAgent {
  name?: string;
  roleName?: string;
  model?: string;
  systemPrompt?: string;
  mcpIds?: number[];
}

export interface UpdateEnvironment {
  name: string;
  url?: string;
  environmentVariables?: Record<string, string>;
}

export interface UpdateTask {
  name?: string;
  type?: TaskType | null;
  workingDirectory?: string;
  scriptType?: ScriptType;
  scriptContent?: string;
}

export interface UpdateBacklog {
  title?: string;
  description?: string;
  status?: BacklogStatus;
  tags?: string[];
  workspaceId?: number;
  sessionId?: number;
}

export interface UpdateMCP {
  name?: string;
  description?: string;
  type?: MCPType;
  path?: string;
}

// Task Status DTO
export interface TaskStatusDto {
  taskId: number;
  name: string;
  status: TaskStatus;
  output?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Task Execution Result DTO
export interface TaskExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  exitCode: number;
  startedAt: Date;
  completedAt: Date;
}

// Environment Variable DTOs
export interface EnvironmentVariable {
  key: string;
  value: string;
}

export interface CreateEnvironmentVariable {
  key: string;
  value: string;
}

export interface UpdateEnvironmentVariable {
  value: string;
}

// Workspace Environment Variable DTOs
export interface WorkspaceEnvironmentVariable {
  key: string;
  value: string;
}

export interface CreateWorkspaceEnvironmentVariable {
  key: string;
  value: string;
}

export interface UpdateWorkspaceEnvironmentVariable {
  value: string;
}

// Git-related types
export enum GitChangeType {
  Added = 0,
  Modified = 1,
  Deleted = 2,
  Renamed = 3,
  Copied = 4
}

export interface GitFileStatus {
  filePath: string;
  changeType: GitChangeType;
}

export interface GitStatusResult {
  stagedFiles: GitFileStatus[];
  unstagedFiles: GitFileStatus[];
  untrackedFiles: string[];
}

// Session Task DTOs
export interface SessionTask {
  id: number;
  name: string;
  type?: TaskType | null;
  status: TaskStatus;
  taskExecutionId?: string;
}

// Environment Task DTOs
export interface EnvironmentTask {
  id: number;
  name: string;
  type?: TaskType | null;
  status: TaskStatus;
  taskExecutionId?: string;
}

// Task operation DTOs
export interface StartTaskDto {
  name: string;
  type: TaskType | null;
  workingDirectory: string;
  scriptType: ScriptType;
  scriptContent: string;
}

export interface StartSessionTaskResponse {
  taskExecutionId: string;
}

// Environment task response DTOs
export interface StartEnvironmentTaskResponse {
  taskExecutionId: string;
}

// Tasks

export interface GetTaskOutputResponseDto {
  taskExecutionId: string;
  output: string;
  status: TaskStatus;
}
