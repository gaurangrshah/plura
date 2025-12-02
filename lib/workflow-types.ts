import { z } from 'zod';

// =============================================================================
// WORKFLOW NODE TYPES
// =============================================================================

export const WorkflowNodeType = z.enum([
  'Trigger',
  'Action',
  'Condition',
  'Wait',
  'Email',
  'Notification',
]);
export type WorkflowNodeType = z.infer<typeof WorkflowNodeType>;

// Trigger subtypes - what can start a workflow
export const TriggerType = z.enum([
  'CONTACT_FORM',       // Form submission
  'PIPELINE_STAGE_CHANGE', // Ticket moved to new stage
  'TICKET_CREATED',     // New ticket created
  'MANUAL',             // Manual trigger (for testing)
]);
export type TriggerType = z.infer<typeof TriggerType>;

// Action subtypes - what a workflow can do
export const ActionType = z.enum([
  'CREATE_CONTACT',
  'UPDATE_CONTACT',
  'MOVE_PIPELINE_STAGE',
  'SEND_EMAIL',
  'SEND_NOTIFICATION',
  'WEBHOOK',
]);
export type ActionType = z.infer<typeof ActionType>;

// Condition operators
export const ConditionOperator = z.enum([
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'greater_than',
  'less_than',
  'is_empty',
  'is_not_empty',
]);
export type ConditionOperator = z.infer<typeof ConditionOperator>;

// =============================================================================
// NODE CONTENT SCHEMAS (type-specific configuration)
// =============================================================================

// Base content all nodes have
const BaseNodeContent = z.object({
  nodeType: WorkflowNodeType,
});

// Trigger node content
export const TriggerNodeContent = BaseNodeContent.extend({
  nodeType: z.literal('Trigger'),
  triggerType: TriggerType,
  config: z.object({
    // For CONTACT_FORM: which form/funnel page
    funnelPageId: z.string().optional(),
    // For PIPELINE_STAGE_CHANGE: which pipeline/stage
    pipelineId: z.string().optional(),
    laneId: z.string().optional(),
  }).optional(),
});
export type TriggerNodeContent = z.infer<typeof TriggerNodeContent>;

// Action node content
export const ActionNodeContent = BaseNodeContent.extend({
  nodeType: z.literal('Action'),
  actionType: ActionType,
  config: z.object({
    // For CREATE_CONTACT/UPDATE_CONTACT
    contactFields: z.record(z.string()).optional(),
    // For MOVE_PIPELINE_STAGE
    targetPipelineId: z.string().optional(),
    targetLaneId: z.string().optional(),
    // For SEND_EMAIL
    emailTemplate: z.string().optional(),
    emailSubject: z.string().optional(),
    // For SEND_NOTIFICATION
    notificationMessage: z.string().optional(),
    // For WEBHOOK
    webhookUrl: z.string().optional(),
    webhookMethod: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional(),
    webhookHeaders: z.record(z.string()).optional(),
    webhookBody: z.string().optional(),
  }).optional(),
});
export type ActionNodeContent = z.infer<typeof ActionNodeContent>;

// Condition node content
export const ConditionNodeContent = BaseNodeContent.extend({
  nodeType: z.literal('Condition'),
  config: z.object({
    field: z.string(),           // e.g., "contact.email", "ticket.value"
    operator: ConditionOperator,
    value: z.string(),
  }).optional(),
});
export type ConditionNodeContent = z.infer<typeof ConditionNodeContent>;

// Wait node content
export const WaitNodeContent = BaseNodeContent.extend({
  nodeType: z.literal('Wait'),
  config: z.object({
    duration: z.number(),        // in milliseconds
    unit: z.enum(['seconds', 'minutes', 'hours', 'days']),
  }).optional(),
});
export type WaitNodeContent = z.infer<typeof WaitNodeContent>;

// Email node content (alias for action with pre-filled type)
export const EmailNodeContent = BaseNodeContent.extend({
  nodeType: z.literal('Email'),
  config: z.object({
    to: z.string(),              // Can use variables: {{contact.email}}
    subject: z.string(),
    body: z.string(),
    fromName: z.string().optional(),
  }).optional(),
});
export type EmailNodeContent = z.infer<typeof EmailNodeContent>;

// Notification node content
export const NotificationNodeContent = BaseNodeContent.extend({
  nodeType: z.literal('Notification'),
  config: z.object({
    message: z.string(),
    userId: z.string().optional(), // If blank, notify all team members
  }).optional(),
});
export type NotificationNodeContent = z.infer<typeof NotificationNodeContent>;

// Union of all node contents
export const EditorNodeContent = z.discriminatedUnion('nodeType', [
  TriggerNodeContent,
  ActionNodeContent,
  ConditionNodeContent,
  WaitNodeContent,
  EmailNodeContent,
  NotificationNodeContent,
]);
export type EditorNodeContent = z.infer<typeof EditorNodeContent>;

// =============================================================================
// REACTFLOW NODE & EDGE SCHEMAS
// =============================================================================

// Data stored in each ReactFlow node
export const EditorNodeData = z.object({
  title: z.string(),
  description: z.string().default(''),
  completed: z.boolean().default(false),
  current: z.boolean().default(false),
  content: EditorNodeContent,
});
export type EditorNodeData = z.infer<typeof EditorNodeData>;

// Complete ReactFlow node
export const EditorNode = z.object({
  id: z.string(),
  type: z.string().default('WorkflowNode'), // Custom node type
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: EditorNodeData,
});
export type EditorNode = z.infer<typeof EditorNode>;

// ReactFlow edge (connection between nodes)
export const WorkflowEdge = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  // For condition nodes: which branch (true/false)
  label: z.string().optional(),
});
export type WorkflowEdge = z.infer<typeof WorkflowEdge>;

// =============================================================================
// EDITOR STATE
// =============================================================================

export type EditorState = {
  elements: EditorNode[];
  edges: WorkflowEdge[];
  selectedNode: EditorNode | null;
};

export type EditorHistoryState = {
  history: EditorState[];
  currentIndex: number;
};

export type EditorAction =
  | { type: 'LOAD_DATA'; payload: { elements: EditorNode[]; edges: WorkflowEdge[] } }
  | { type: 'ADD_NODE'; payload: EditorNode }
  | { type: 'UPDATE_NODE'; payload: EditorNode }
  | { type: 'DELETE_NODE'; payload: { id: string } }
  | { type: 'SELECT_NODE'; payload: { node: EditorNode | null } }
  | { type: 'UPDATE_EDGES'; payload: WorkflowEdge[] }
  | { type: 'ADD_EDGE'; payload: WorkflowEdge }
  | { type: 'DELETE_EDGE'; payload: { id: string } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR' };

// =============================================================================
// WORKFLOW EXECUTION
// =============================================================================

export const WorkflowInstanceStatus = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
]);
export type WorkflowInstanceStatus = z.infer<typeof WorkflowInstanceStatus>;

export const ExecutionLogEntry = z.object({
  timestamp: z.string(),  // ISO date
  nodeId: z.string(),
  nodeType: WorkflowNodeType,
  status: z.enum(['started', 'completed', 'failed', 'skipped']),
  message: z.string().optional(),
  data: z.record(z.any()).optional(),
});
export type ExecutionLogEntry = z.infer<typeof ExecutionLogEntry>;

// =============================================================================
// FORM SCHEMAS
// =============================================================================

export const CreateWorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
});
export type CreateWorkflowInput = z.infer<typeof CreateWorkflowSchema>;

export const UpdateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  nodes: z.string().optional(),  // JSON string
  edges: z.string().optional(),  // JSON string
  published: z.boolean().optional(),
});
export type UpdateWorkflowInput = z.infer<typeof UpdateWorkflowSchema>;

// =============================================================================
// NODE PALETTE (available nodes for drag-drop)
// =============================================================================

export type NodePaletteItem = {
  type: WorkflowNodeType;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  defaultContent: EditorNodeContent;
};

export const NODE_PALETTE: NodePaletteItem[] = [
  {
    type: 'Trigger',
    title: 'Trigger',
    description: 'Start the workflow',
    icon: 'Zap',
    defaultContent: {
      nodeType: 'Trigger',
      triggerType: 'MANUAL',
    },
  },
  {
    type: 'Action',
    title: 'Action',
    description: 'Perform an action',
    icon: 'Play',
    defaultContent: {
      nodeType: 'Action',
      actionType: 'SEND_NOTIFICATION',
    },
  },
  {
    type: 'Condition',
    title: 'Condition',
    description: 'Branch based on criteria',
    icon: 'GitBranch',
    defaultContent: {
      nodeType: 'Condition',
    },
  },
  {
    type: 'Wait',
    title: 'Wait',
    description: 'Delay execution',
    icon: 'Clock',
    defaultContent: {
      nodeType: 'Wait',
      config: {
        duration: 1,
        unit: 'hours',
      },
    },
  },
  {
    type: 'Email',
    title: 'Send Email',
    description: 'Send an email',
    icon: 'Mail',
    defaultContent: {
      nodeType: 'Email',
    },
  },
  {
    type: 'Notification',
    title: 'Notification',
    description: 'Send in-app notification',
    icon: 'Bell',
    defaultContent: {
      nodeType: 'Notification',
    },
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse nodes JSON string with validation
 */
export function parseNodes(nodesJson: string): EditorNode[] {
  try {
    const parsed = JSON.parse(nodesJson);
    return z.array(EditorNode).parse(parsed);
  } catch {
    console.error('Failed to parse workflow nodes');
    return [];
  }
}

/**
 * Parse edges JSON string with validation
 */
export function parseEdges(edgesJson: string): WorkflowEdge[] {
  try {
    const parsed = JSON.parse(edgesJson);
    return z.array(WorkflowEdge).parse(parsed);
  } catch {
    console.error('Failed to parse workflow edges');
    return [];
  }
}

/**
 * Stringify nodes with validation
 */
export function stringifyNodes(nodes: EditorNode[]): string {
  return JSON.stringify(z.array(EditorNode).parse(nodes));
}

/**
 * Stringify edges with validation
 */
export function stringifyEdges(edges: WorkflowEdge[]): string {
  return JSON.stringify(z.array(WorkflowEdge).parse(edges));
}

/**
 * Create a new node with default values
 */
export function createNode(
  type: WorkflowNodeType,
  position: { x: number; y: number },
  id?: string
): EditorNode {
  const paletteItem = NODE_PALETTE.find((item) => item.type === type);
  if (!paletteItem) throw new Error(`Unknown node type: ${type}`);

  return {
    id: id || crypto.randomUUID(),
    type: 'WorkflowNode',
    position,
    data: {
      title: paletteItem.title,
      description: paletteItem.description,
      completed: false,
      current: false,
      content: paletteItem.defaultContent,
    },
  };
}

/**
 * Get the trigger node from a workflow (there should only be one)
 */
export function getTriggerNode(nodes: EditorNode[]): EditorNode | undefined {
  return nodes.find((node) => node.data.content.nodeType === 'Trigger');
}

/**
 * Compute execution order from nodes and edges (topological sort)
 */
export function computeFlowPath(
  nodes: EditorNode[],
  edges: WorkflowEdge[]
): string[] {
  const trigger = getTriggerNode(nodes);
  if (!trigger) return [];

  const visited = new Set<string>();
  const path: string[] = [];

  function visit(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    path.push(nodeId);

    // Find edges from this node
    const outgoingEdges = edges.filter((e) => e.source === nodeId);
    for (const edge of outgoingEdges) {
      visit(edge.target);
    }
  }

  visit(trigger.id);
  return path;
}
