import { Button, Badge } from '@/components';
import { Edit3, Trash2, Package } from 'lucide-react';
import { MCP, MCPType } from '@/types';

interface MCPCardProps {
  mcp: MCP;
  onEdit: (mcp: MCP) => void;
  onDelete: (id: number) => void;
}

const getTypeColor = (type: MCPType) => {
  switch (type) {
    case MCPType.HttpStreaming:
      return 'bg-purple-100 text-purple-800';
    case MCPType.Sse:
      return 'bg-green-100 text-green-800';
    case MCPType.Stdio:
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
};

const getTypeName = (type: MCPType) => {
  switch (type) {
    case MCPType.HttpStreaming:
      return 'HTTP Streaming';
    case MCPType.Sse:
      return 'SSE (Server-Sent Events)';
    case MCPType.Stdio:
      return 'STDIO';
    default:
      return 'Unknown';
  }
};

export default function MCPCard({ mcp, onEdit, onDelete }: MCPCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg text-neutral-900 dark:text-neutral-100">
              {mcp.name}
            </h3>
            {mcp.description && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                    {mcp.description || 'No description provided'}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getTypeColor(mcp.type)}>
                {getTypeName(mcp.type)}
              </Badge>
              <code className="text-sm bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 px-2 py-1 rounded break-all">
                {mcp.path}
              </code>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(mcp)}>
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(mcp.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
