'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  Zap,
  Play,
  GitBranch,
  Clock,
  Mail,
  Bell,
  Trash2,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useWorkflowEditor } from '@/providers/workflow-editor-provider';
import type { EditorNodeData, WorkflowNodeType } from '@/lib/workflow-types';

const nodeIcons: Record<WorkflowNodeType, React.ElementType> = {
  Trigger: Zap,
  Action: Play,
  Condition: GitBranch,
  Wait: Clock,
  Email: Mail,
  Notification: Bell,
};

const nodeColors: Record<WorkflowNodeType, string> = {
  Trigger: 'border-green-500 bg-green-50 dark:bg-green-950/20',
  Action: 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
  Condition: 'border-amber-500 bg-amber-50 dark:bg-amber-950/20',
  Wait: 'border-violet-500 bg-violet-50 dark:bg-violet-950/20',
  Email: 'border-pink-500 bg-pink-50 dark:bg-pink-950/20',
  Notification: 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20',
};

const iconColors: Record<WorkflowNodeType, string> = {
  Trigger: 'text-green-600',
  Action: 'text-blue-600',
  Condition: 'text-amber-600',
  Wait: 'text-violet-600',
  Email: 'text-pink-600',
  Notification: 'text-cyan-600',
};

function WorkflowNodeComponent({ id, data, selected }: NodeProps<EditorNodeData>) {
  const { dispatch } = useWorkflowEditor();
  const nodeType = data.content.nodeType;
  const Icon = nodeIcons[nodeType];

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'DELETE_NODE', payload: { id } });
  };

  // Condition nodes have two outputs (true/false)
  const isCondition = nodeType === 'Condition';

  return (
    <div className="relative">
      {/* Input handle (not for triggers) */}
      {nodeType !== 'Trigger' && (
        <Handle
          type="target"
          position={Position.Top}
          className="!h-3 !w-3 !border-2 !border-background !bg-muted-foreground"
        />
      )}

      <Card
        className={`min-w-[200px] border-2 transition-shadow ${
          nodeColors[nodeType]
        } ${selected ? 'shadow-lg ring-2 ring-primary' : ''}`}
      >
        <CardHeader className="p-3 pb-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`rounded-md p-1.5 ${iconColors[nodeType]} bg-background`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-medium">
                {data.title}
              </CardTitle>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-1">
          {data.description && (
            <p className="text-xs text-muted-foreground">{data.description}</p>
          )}

          {/* Show node-specific info */}
          <div className="mt-2 flex flex-wrap gap-1">
            {nodeType === 'Trigger' && 'triggerType' in data.content && (
              <Badge variant="secondary" className="text-xs">
                {data.content.triggerType}
              </Badge>
            )}
            {nodeType === 'Action' && 'actionType' in data.content && (
              <Badge variant="secondary" className="text-xs">
                {data.content.actionType}
              </Badge>
            )}
            {nodeType === 'Wait' && data.content.config && (
              <Badge variant="secondary" className="text-xs">
                {data.content.config.duration} {data.content.config.unit}
              </Badge>
            )}
          </div>

          {/* Status indicators */}
          {data.completed && (
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
              <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
              Completed
            </div>
          )}
          {data.current && (
            <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
              Running
            </div>
          )}
        </CardContent>
      </Card>

      {/* Output handles */}
      {isCondition ? (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="!left-[30%] !h-3 !w-3 !border-2 !border-background !bg-green-500"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="!left-[70%] !h-3 !w-3 !border-2 !border-background !bg-red-500"
          />
          <div className="absolute -bottom-6 left-0 flex w-full justify-between px-[25%] text-[10px] text-muted-foreground">
            <span>True</span>
            <span>False</span>
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-3 !w-3 !border-2 !border-background !bg-muted-foreground"
        />
      )}
    </div>
  );
}

export const WorkflowNode = memo(WorkflowNodeComponent);
