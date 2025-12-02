'use client';

import { useState } from 'react';
import {
  Zap,
  Play,
  GitBranch,
  Clock,
  Mail,
  Bell,
  ChevronRight,
  Settings,
  Palette,
} from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { useSelectedNode } from '@/providers/workflow-editor-provider';
import { NODE_PALETTE, type WorkflowNodeType } from '@/lib/workflow-types';

import { NodeSettings } from './node-settings';

const nodeIcons: Record<WorkflowNodeType, React.ElementType> = {
  Trigger: Zap,
  Action: Play,
  Condition: GitBranch,
  Wait: Clock,
  Email: Mail,
  Notification: Bell,
};

type EditorSidebarProps = {
  workflowId: string;
};

export function EditorSidebar({ workflowId }: EditorSidebarProps) {
  const selectedNode = useSelectedNode();

  return (
    <div className="w-[320px] border-l bg-background">
      <Tabs defaultValue={selectedNode ? 'settings' : 'palette'}>
        <div className="border-b px-4 py-2">
          <TabsList className="w-full">
            <TabsTrigger value="palette" className="flex-1 gap-2">
              <Palette className="h-4 w-4" />
              Nodes
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="palette" className="m-0">
          <NodePalette />
        </TabsContent>

        <TabsContent value="settings" className="m-0">
          {selectedNode ? (
            <NodeSettings node={selectedNode} workflowId={workflowId} />
          ) : (
            <div className="flex h-[400px] items-center justify-center p-4 text-center text-muted-foreground">
              <div>
                <Settings className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">Select a node to edit its settings</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NodePalette() {
  const onDragStart = (
    event: React.DragEvent,
    nodeData: (typeof NODE_PALETTE)[0]
  ) => {
    const data = {
      title: nodeData.title,
      description: nodeData.description,
      completed: false,
      current: false,
      content: nodeData.defaultContent,
    };
    event.dataTransfer.setData('application/reactflow', JSON.stringify(data));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="p-4">
        <p className="mb-4 text-sm text-muted-foreground">
          Drag nodes onto the canvas to build your workflow.
        </p>

        <Accordion
          type="multiple"
          defaultValue={['triggers', 'actions', 'flow']}
        >
          <AccordionItem value="triggers">
            <AccordionTrigger className="text-sm font-medium">
              Triggers
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {NODE_PALETTE.filter((n) => n.type === 'Trigger').map(
                  (node) => (
                    <DraggableNode
                      key={node.type}
                      node={node}
                      onDragStart={onDragStart}
                    />
                  )
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="actions">
            <AccordionTrigger className="text-sm font-medium">
              Actions
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {NODE_PALETTE.filter((n) =>
                  ['Action', 'Email', 'Notification'].includes(n.type)
                ).map((node) => (
                  <DraggableNode
                    key={node.type}
                    node={node}
                    onDragStart={onDragStart}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="flow">
            <AccordionTrigger className="text-sm font-medium">
              Flow Control
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {NODE_PALETTE.filter((n) =>
                  ['Condition', 'Wait'].includes(n.type)
                ).map((node) => (
                  <DraggableNode
                    key={node.type}
                    node={node}
                    onDragStart={onDragStart}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </ScrollArea>
  );
}

type DraggableNodeProps = {
  node: (typeof NODE_PALETTE)[0];
  onDragStart: (
    event: React.DragEvent,
    nodeData: (typeof NODE_PALETTE)[0]
  ) => void;
};

function DraggableNode({ node, onDragStart }: DraggableNodeProps) {
  const Icon = nodeIcons[node.type];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, node)}
      className="group flex cursor-grab items-center gap-3 rounded-lg border bg-card p-3 transition-all hover:border-primary hover:shadow-sm active:cursor-grabbing"
    >
      <div className="rounded-md bg-muted p-2">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{node.title}</p>
        <p className="text-xs text-muted-foreground">{node.description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}
