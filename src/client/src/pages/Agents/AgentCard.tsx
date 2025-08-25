import { Button, Badge } from '@/components';
import { Edit3, Trash2, Bot, Code } from 'lucide-react';
import { Agent } from '@/types';

interface AgentCardProps {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onDelete: (agentId: number, agentName: string) => void;
}

export default function AgentCard({ agent, onEdit, onDelete }: AgentCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Bot className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg text-neutral-900 dark:text-neutral-100">
              {agent.name}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {agent.roleName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(agent)}>
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(agent.id, agent.name)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Badge className="font-mono">{agent.model}</Badge>
        </div>

        {agent.mcps?.length > 0 && (
          <div>
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              MCPs:
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {agent.mcps.map((mcp, index) => (
                <Badge key={index} className="bg-green-100 text-green-800">
                  <Code className="w-3 h-3 mr-1" />
                  {mcp.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
