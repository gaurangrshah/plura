'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MoreVertical,
  Pencil,
  Trash2,
  Play,
  Zap,
  GitBranch,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

import {
  deleteWorkflow,
  publishWorkflow,
  executeWorkflow,
} from '../_actions/workflow-actions';

type WorkflowCardProps = {
  workflow: {
    id: string;
    name: string;
    description: string;
    published: boolean;
    nodeCount: number;
    instanceCount: number;
    updatedAt: Date;
  };
  subAccountId: string;
};

export function WorkflowCard({ workflow, subAccountId }: WorkflowCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPublished, setIsPublished] = useState(workflow.published);
  const [isLoading, setIsLoading] = useState(false);

  const handlePublishToggle = async () => {
    setIsLoading(true);
    const result = await publishWorkflow(workflow.id, !isPublished);

    if (result.success) {
      setIsPublished(!isPublished);
      toast({
        title: result.message,
        description: !isPublished
          ? 'Workflow is now active and will respond to triggers.'
          : 'Workflow has been deactivated.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    setIsLoading(true);
    const result = await deleteWorkflow(workflow.id);

    if (result.success) {
      toast({
        title: 'Workflow deleted',
        description: 'The workflow has been permanently removed.',
      });
      router.refresh();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
    setIsLoading(false);
  };

  const handleManualRun = async () => {
    if (!isPublished) {
      toast({
        variant: 'destructive',
        title: 'Cannot run workflow',
        description: 'Workflow must be published to run.',
      });
      return;
    }

    setIsLoading(true);
    const result = await executeWorkflow(workflow.id, 'MANUAL', {
      triggeredAt: new Date().toISOString(),
      triggeredBy: 'manual',
    });

    if (result.success) {
      toast({
        title: 'Workflow started',
        description: 'Check the execution history for results.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Execution failed',
        description: result.error,
      });
    }
    setIsLoading(false);
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(workflow.updatedAt));

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`rounded-full p-2 ${
                isPublished
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/20'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg">
                <Link
                  href={`/subaccount/${subAccountId}/workflows/editor/${workflow.id}`}
                  className="hover:underline"
                >
                  {workflow.name}
                </Link>
              </CardTitle>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={`/subaccount/${subAccountId}/workflows/editor/${workflow.id}`}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleManualRun}
                disabled={!isPublished || isLoading}
              >
                <Play className="mr-2 h-4 w-4" />
                Run Now
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isLoading}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {workflow.description && (
          <CardDescription className="mt-1 line-clamp-2">
            {workflow.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <GitBranch className="h-4 w-4" />
              <span>{workflow.nodeCount} nodes</span>
            </div>
            <div className="flex items-center gap-1">
              <Play className="h-4 w-4" />
              <span>{workflow.instanceCount} runs</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {isPublished ? 'Active' : 'Inactive'}
            </span>
            <Switch
              checked={isPublished}
              onCheckedChange={handlePublishToggle}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">
            Updated {formattedDate}
          </span>
          {isPublished && (
            <Badge variant="secondary" className="text-xs">
              Live
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
