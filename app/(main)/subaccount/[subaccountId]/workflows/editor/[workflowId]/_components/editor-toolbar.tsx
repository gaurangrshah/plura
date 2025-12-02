'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Undo2,
  Redo2,
  Play,
  MoreVertical,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

import { useWorkflowEditor, useWorkflowHistory } from '@/providers/workflow-editor-provider';
import {
  saveWorkflowNodes,
  publishWorkflow,
  deleteWorkflow,
  executeWorkflow,
} from '../../../_actions/workflow-actions';

type EditorToolbarProps = {
  workflowId: string;
  workflowName: string;
  published: boolean;
  subAccountId: string;
};

export function EditorToolbar({
  workflowId,
  workflowName,
  published: initialPublished,
  subAccountId,
}: EditorToolbarProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { state } = useWorkflowEditor();
  const { undo, redo, canUndo, canRedo } = useWorkflowHistory();

  const [isSaving, setIsSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(initialPublished);
  const [isRunning, setIsRunning] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveWorkflowNodes(
      workflowId,
      state.elements,
      state.edges
    );

    if (result.success) {
      toast({
        title: 'Workflow saved',
        description: 'Your changes have been saved.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to save workflow.',
      });
    }
    setIsSaving(false);
  };

  const handlePublishToggle = async () => {
    const result = await publishWorkflow(workflowId, !isPublished);

    if (result.success) {
      setIsPublished(!isPublished);
      toast({
        title: result.message,
        description: !isPublished
          ? 'Workflow is now active.'
          : 'Workflow has been deactivated.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
  };

  const handleRun = async () => {
    // Save first
    await handleSave();

    if (!isPublished) {
      toast({
        variant: 'destructive',
        title: 'Cannot run',
        description: 'Publish the workflow first.',
      });
      return;
    }

    setIsRunning(true);
    const result = await executeWorkflow(workflowId, 'MANUAL', {
      triggeredAt: new Date().toISOString(),
      triggeredBy: 'manual',
    });

    if (result.success) {
      toast({
        title: 'Workflow started',
        description: 'Check execution history for results.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Execution failed',
        description: result.error,
      });
    }
    setIsRunning(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    const result = await deleteWorkflow(workflowId);

    if (result.success) {
      toast({
        title: 'Workflow deleted',
      });
      router.push(`/subaccount/${subAccountId}/workflows`);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
  };

  return (
    <div className="flex items-center justify-between border-b bg-background px-4 py-2">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/subaccount/${subAccountId}/workflows`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div>
          <h1 className="text-lg font-semibold">{workflowName}</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {state.elements.length} nodes
            </span>
            {isPublished && (
              <Badge variant="secondary" className="text-xs">
                Live
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        <div className="flex items-center border-r pr-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={!canUndo}
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={!canRedo}
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Run */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRun}
          disabled={isRunning || !isPublished}
        >
          <Play className="mr-2 h-4 w-4" />
          {isRunning ? 'Running...' : 'Run'}
        </Button>

        {/* Save */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>

        {/* Publish Toggle */}
        <div className="flex items-center gap-2 border-l pl-2">
          <span className="text-sm text-muted-foreground">
            {isPublished ? 'Active' : 'Draft'}
          </span>
          <Switch checked={isPublished} onCheckedChange={handlePublishToggle} />
        </div>

        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Workflow
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
