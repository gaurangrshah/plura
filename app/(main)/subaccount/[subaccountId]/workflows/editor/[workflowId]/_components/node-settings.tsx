'use client';

import { useCallback } from 'react';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import { useWorkflowEditor } from '@/providers/workflow-editor-provider';
import type {
  EditorNode,
  TriggerType,
  ActionType,
} from '@/lib/workflow-types';

type NodeSettingsProps = {
  node: EditorNode;
  workflowId: string;
};

export function NodeSettings({ node, workflowId }: NodeSettingsProps) {
  const { dispatch } = useWorkflowEditor();
  const { content } = node.data;

  const updateNode = useCallback(
    (updates: Partial<EditorNode['data']>) => {
      dispatch({
        type: 'UPDATE_NODE',
        payload: {
          ...node,
          data: {
            ...node.data,
            ...updates,
          },
        },
      });
    },
    [node, dispatch]
  );

  const updateContent = useCallback(
    (updates: Partial<typeof content>) => {
      updateNode({
        content: {
          ...content,
          ...updates,
        } as typeof content,
      });
    },
    [content, updateNode]
  );

  const updateConfig = useCallback(
    (updates: Record<string, any>) => {
      updateContent({
        config: {
          ...(content.config || {}),
          ...updates,
        },
      } as Partial<typeof content>);
    },
    [content, updateContent]
  );

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-6 p-4">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Node Info</h3>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={node.data.title}
              onChange={(e) => updateNode({ title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={node.data.description}
              onChange={(e) => updateNode({ description: e.target.value })}
              className="resize-none"
              rows={2}
            />
          </div>
        </div>

        <Separator />

        {/* Node-specific settings */}
        {content.nodeType === 'Trigger' && (
          <TriggerSettings
            content={content as any}
            updateContent={updateContent}
          />
        )}

        {content.nodeType === 'Action' && (
          <ActionSettings
            content={content as any}
            updateContent={updateContent}
            updateConfig={updateConfig}
          />
        )}

        {content.nodeType === 'Condition' && (
          <ConditionSettings
            content={content as any}
            updateConfig={updateConfig}
          />
        )}

        {content.nodeType === 'Wait' && (
          <WaitSettings content={content as any} updateConfig={updateConfig} />
        )}

        {content.nodeType === 'Email' && (
          <EmailSettings
            content={content as any}
            updateConfig={updateConfig}
          />
        )}

        {content.nodeType === 'Notification' && (
          <NotificationSettings
            content={content as any}
            updateConfig={updateConfig}
          />
        )}
      </div>
    </ScrollArea>
  );
}

// =============================================================================
// TRIGGER SETTINGS
// =============================================================================

type TriggerSettingsProps = {
  content: { nodeType: 'Trigger'; triggerType: TriggerType };
  updateContent: (updates: any) => void;
};

function TriggerSettings({ content, updateContent }: TriggerSettingsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Trigger Settings</h3>

      <div className="space-y-2">
        <Label>Trigger Type</Label>
        <Select
          value={content.triggerType}
          onValueChange={(value: TriggerType) =>
            updateContent({ triggerType: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MANUAL">Manual (Test)</SelectItem>
            <SelectItem value="CONTACT_FORM">Contact Form Submission</SelectItem>
            <SelectItem value="TICKET_CREATED">New Ticket Created</SelectItem>
            <SelectItem value="PIPELINE_STAGE_CHANGE">
              Pipeline Stage Change
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {content.triggerType === 'MANUAL' &&
            'Manually trigger this workflow for testing.'}
          {content.triggerType === 'CONTACT_FORM' &&
            'Runs when a contact form is submitted.'}
          {content.triggerType === 'TICKET_CREATED' &&
            'Runs when a new ticket is created.'}
          {content.triggerType === 'PIPELINE_STAGE_CHANGE' &&
            'Runs when a ticket moves to a new stage.'}
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// ACTION SETTINGS
// =============================================================================

type ActionSettingsProps = {
  content: { nodeType: 'Action'; actionType: ActionType; config?: any };
  updateContent: (updates: any) => void;
  updateConfig: (updates: any) => void;
};

function ActionSettings({
  content,
  updateContent,
  updateConfig,
}: ActionSettingsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Action Settings</h3>

      <div className="space-y-2">
        <Label>Action Type</Label>
        <Select
          value={content.actionType}
          onValueChange={(value: ActionType) =>
            updateContent({ actionType: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CREATE_CONTACT">Create Contact</SelectItem>
            <SelectItem value="UPDATE_CONTACT">Update Contact</SelectItem>
            <SelectItem value="SEND_NOTIFICATION">Send Notification</SelectItem>
            <SelectItem value="MOVE_PIPELINE_STAGE">Move to Stage</SelectItem>
            <SelectItem value="WEBHOOK">Call Webhook</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Webhook settings */}
      {content.actionType === 'WEBHOOK' && (
        <>
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <Input
              placeholder="https://example.com/webhook"
              value={content.config?.webhookUrl || ''}
              onChange={(e) => updateConfig({ webhookUrl: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Method</Label>
            <Select
              value={content.config?.webhookMethod || 'POST'}
              onValueChange={(value) => updateConfig({ webhookMethod: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Notification settings */}
      {content.actionType === 'SEND_NOTIFICATION' && (
        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            placeholder="Notification message..."
            value={content.config?.notificationMessage || ''}
            onChange={(e) =>
              updateConfig({ notificationMessage: e.target.value })
            }
            className="resize-none"
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Use {'{{contact.name}}'} to include dynamic data.
          </p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CONDITION SETTINGS
// =============================================================================

type ConditionSettingsProps = {
  content: { nodeType: 'Condition'; config?: any };
  updateConfig: (updates: any) => void;
};

function ConditionSettings({ content, updateConfig }: ConditionSettingsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Condition Settings</h3>

      <div className="space-y-2">
        <Label>Field</Label>
        <Select
          value={content.config?.field || ''}
          onValueChange={(value) => updateConfig({ field: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select field" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="contact.email">Contact Email</SelectItem>
            <SelectItem value="contact.name">Contact Name</SelectItem>
            <SelectItem value="ticket.value">Ticket Value</SelectItem>
            <SelectItem value="ticket.name">Ticket Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Operator</Label>
        <Select
          value={content.config?.operator || 'equals'}
          onValueChange={(value) => updateConfig({ operator: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">Equals</SelectItem>
            <SelectItem value="not_equals">Not Equals</SelectItem>
            <SelectItem value="contains">Contains</SelectItem>
            <SelectItem value="not_contains">Does Not Contain</SelectItem>
            <SelectItem value="is_empty">Is Empty</SelectItem>
            <SelectItem value="is_not_empty">Is Not Empty</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Value</Label>
        <Input
          placeholder="Value to compare..."
          value={content.config?.value || ''}
          onChange={(e) => updateConfig({ value: e.target.value })}
        />
      </div>
    </div>
  );
}

// =============================================================================
// WAIT SETTINGS
// =============================================================================

type WaitSettingsProps = {
  content: { nodeType: 'Wait'; config?: any };
  updateConfig: (updates: any) => void;
};

function WaitSettings({ content, updateConfig }: WaitSettingsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Wait Settings</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Duration</Label>
          <Input
            type="number"
            min="1"
            value={content.config?.duration || 1}
            onChange={(e) =>
              updateConfig({ duration: parseInt(e.target.value) || 1 })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Unit</Label>
          <Select
            value={content.config?.unit || 'hours'}
            onValueChange={(value) => updateConfig({ unit: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seconds">Seconds</SelectItem>
              <SelectItem value="minutes">Minutes</SelectItem>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="days">Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EMAIL SETTINGS
// =============================================================================

type EmailSettingsProps = {
  content: { nodeType: 'Email'; config?: any };
  updateConfig: (updates: any) => void;
};

function EmailSettings({ content, updateConfig }: EmailSettingsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Email Settings</h3>

      <div className="space-y-2">
        <Label>To</Label>
        <Input
          placeholder="{{contact.email}}"
          value={content.config?.to || ''}
          onChange={(e) => updateConfig({ to: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Use {'{{contact.email}}'} for dynamic recipient.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Subject</Label>
        <Input
          placeholder="Email subject..."
          value={content.config?.subject || ''}
          onChange={(e) => updateConfig({ subject: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Body</Label>
        <Textarea
          placeholder="Email body..."
          value={content.config?.body || ''}
          onChange={(e) => updateConfig({ body: e.target.value })}
          className="resize-none"
          rows={5}
        />
      </div>
    </div>
  );
}

// =============================================================================
// NOTIFICATION SETTINGS
// =============================================================================

type NotificationSettingsProps = {
  content: { nodeType: 'Notification'; config?: any };
  updateConfig: (updates: any) => void;
};

function NotificationSettings({
  content,
  updateConfig,
}: NotificationSettingsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Notification Settings</h3>

      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea
          placeholder="Notification message..."
          value={content.config?.message || ''}
          onChange={(e) => updateConfig({ message: e.target.value })}
          className="resize-none"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Use {'{{contact.name}}'} to include dynamic data.
        </p>
      </div>
    </div>
  );
}
