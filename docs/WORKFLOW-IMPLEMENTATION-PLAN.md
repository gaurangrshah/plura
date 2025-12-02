# Workflow/Automation Implementation Plan

**Date:** 2025-12-01
**Based on:** Fuzzie Production (webprodigies/fuzzie-production)
**Target:** Plura SaaS Platform

---

## Fuzzie Patterns We're Following

### 1. Data Model Pattern
- **Nodes & Edges as JSON**: Store workflow graph as serialized JSON strings
- **Template Storage**: Per-integration templates stored on workflow record
- **Publish Flag**: Control workflow activation
- **Flow Path**: Track execution order

### 2. State Management Pattern
- **EditorProvider**: useReducer with undo/redo history
- **ConnectionsProvider**: useState for integration credentials
- **Actions**: LOAD_DATA, UPDATE_NODE, REDO, UNDO, SELECTED_ELEMENT

### 3. Component Architecture
```
workflows/
├── page.tsx                     # List view
├── _actions/                    # Server actions
├── _components/                 # Shared components
└── editor/[workflowId]/
    ├── page.tsx                 # Editor wrapper with providers
    └── _components/
        ├── editor-canvas.tsx    # ReactFlow canvas
        ├── editor-sidebar.tsx   # Node palette + settings
        └── node-card.tsx        # Individual node rendering
```

### 4. Node Types (Fuzzie's 12 types)
- Trigger, Action, Email, Condition, AI
- Slack, Discord, Notion, Google Drive, Google Calendar
- Custom Webhook, Wait

---

## Optimizations Over Fuzzie

### 1. Type Safety
- **Fuzzie**: Stores nodes/edges as strings, parses at runtime
- **Plura**: Use Zod schemas for validation, typed node content

### 2. Schema Design
- **Fuzzie**: Flat workflow model with all templates on one record
- **Plura**: Normalized schema with separate WorkflowNode table

### 3. Scoping
- **Fuzzie**: User-level workflows
- **Plura**: SubAccount-level (fits existing multi-tenant model)

### 4. Integration Approach
- **Fuzzie**: Direct credential storage on user
- **Plura**: Leverage existing SubAccount settings + add integrations table

### 5. Error Handling
- **Fuzzie**: Basic error handling
- **Plura**: Zod validation, proper error boundaries, toast notifications

---

## Implementation Plan

### Phase 1: Schema Changes

**New/Updated Models:**

```prisma
// Replace linear Automation model with graph-based Workflow
model Workflow {
  id           String   @id @default(uuid())
  name         String
  description  String   @default("")
  nodes        String   @default("[]")  // JSON: EditorNode[]
  edges        String   @default("[]")  // JSON: Edge[]
  published    Boolean  @default(false)
  flowPath     String?  // Execution order
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Plura: Scoped to SubAccount (not User like Fuzzie)
  subAccountId String
  SubAccount   SubAccount @relation(fields: [subAccountId], references: [id], onDelete: Cascade)

  // Execution tracking
  instances    WorkflowInstance[]

  @@index([subAccountId])
}

model WorkflowInstance {
  id         String   @id @default(uuid())
  workflowId String
  Workflow   Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  status     String   @default("pending") // pending, running, completed, failed
  startedAt  DateTime @default(now())
  completedAt DateTime?
  logs       String   @default("[]") // JSON: ExecutionLog[]

  @@index([workflowId])
}

// Optional: Store integration credentials per SubAccount
model SubAccountIntegration {
  id           String     @id @default(uuid())
  type         String     // slack, discord, notion, google
  accessToken  String?
  refreshToken String?
  metadata     String     @default("{}") // JSON: channel IDs, workspace info, etc.
  subAccountId String
  SubAccount   SubAccount @relation(fields: [subAccountId], references: [id], onDelete: Cascade)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@unique([subAccountId, type])
  @@index([subAccountId])
}
```

**Keep Existing Models (for backwards compatibility):**
- Trigger, Automation, Action, AutomationInstance → Mark as deprecated
- Can migrate data later or support both

---

### Phase 2: Type Definitions

**File: `lib/workflow-types.ts`**

```typescript
import { z } from 'zod';

// Node Types - Start with core set, expand later
export const WorkflowNodeType = z.enum([
  'Trigger',
  'Action',
  'Condition',
  'Wait',
  'Email',
  'Notification',
]);

export type WorkflowNodeType = z.infer<typeof WorkflowNodeType>;

// Trigger subtypes
export const TriggerType = z.enum([
  'CONTACT_FORM',
  'PIPELINE_STAGE_CHANGE',
  'TICKET_CREATED',
  'MANUAL',
]);

// Action subtypes
export const ActionType = z.enum([
  'CREATE_CONTACT',
  'UPDATE_CONTACT',
  'MOVE_PIPELINE_STAGE',
  'SEND_EMAIL',
  'SEND_NOTIFICATION',
  'WEBHOOK',
]);

// Node content schema
export const EditorNodeContent = z.object({
  nodeType: WorkflowNodeType,
  triggerType: TriggerType.optional(),
  actionType: ActionType.optional(),
  config: z.record(z.any()).optional(), // Type-specific config
});

// ReactFlow node wrapper
export const EditorNode = z.object({
  id: z.string(),
  type: z.literal('EditorCanvasCard'),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.object({
    title: z.string(),
    description: z.string(),
    completed: z.boolean(),
    current: z.boolean(),
    content: EditorNodeContent,
  }),
});

export type EditorNode = z.infer<typeof EditorNode>;

// ReactFlow edge
export const WorkflowEdge = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
});

export type WorkflowEdge = z.infer<typeof WorkflowEdge>;

// Editor state
export type EditorState = {
  elements: EditorNode[];
  edges: WorkflowEdge[];
  selectedNode: EditorNode | null;
};

// Editor actions
export type EditorAction =
  | { type: 'LOAD_DATA'; payload: { elements: EditorNode[]; edges: WorkflowEdge[] } }
  | { type: 'UPDATE_NODE'; payload: EditorNode }
  | { type: 'ADD_NODE'; payload: EditorNode }
  | { type: 'DELETE_NODE'; payload: { id: string } }
  | { type: 'SELECT_NODE'; payload: { node: EditorNode | null } }
  | { type: 'UPDATE_EDGES'; payload: WorkflowEdge[] }
  | { type: 'UNDO' }
  | { type: 'REDO' };
```

---

### Phase 3: Providers

**File: `providers/workflow-editor-provider.tsx`**

Key improvements over Fuzzie:
- TypeScript strict mode
- Zod validation on load/save
- Optimistic updates with rollback
- Better undo/redo with max history limit

---

### Phase 4: Server Actions

**File: `app/(main)/subaccount/[subaccountId]/workflows/_actions/workflow-actions.ts`**

```typescript
'use server';

// CRUD Operations
export async function getWorkflows(subAccountId: string);
export async function getWorkflow(workflowId: string);
export async function createWorkflow(subAccountId: string, data: CreateWorkflowInput);
export async function updateWorkflow(workflowId: string, data: UpdateWorkflowInput);
export async function deleteWorkflow(workflowId: string);

// Editor Operations
export async function saveWorkflowNodes(workflowId: string, nodes: string, edges: string);
export async function publishWorkflow(workflowId: string, publish: boolean);

// Execution
export async function executeWorkflow(workflowId: string, triggerData?: any);
export async function getWorkflowInstances(workflowId: string);
```

---

### Phase 5: UI Components

**Directory Structure:**
```
app/(main)/subaccount/[subaccountId]/workflows/
├── page.tsx                          # Workflow list
├── _actions/
│   └── workflow-actions.ts
├── _components/
│   ├── workflow-list.tsx
│   ├── workflow-card.tsx
│   └── create-workflow-button.tsx
└── editor/
    └── [workflowId]/
        ├── page.tsx                  # Editor page
        └── _components/
            ├── editor-canvas.tsx     # Main ReactFlow canvas
            ├── editor-sidebar.tsx    # Node palette
            ├── node-card.tsx         # Custom node component
            ├── node-settings.tsx     # Selected node config
            └── toolbar.tsx           # Save, publish, undo/redo
```

---

### Phase 6: Dependencies

```bash
npm install reactflow @reactflow/core @reactflow/controls @reactflow/minimap
```

---

## Implementation Order

1. **Schema** - Add Workflow, WorkflowInstance models
2. **Types** - Create workflow-types.ts with Zod schemas
3. **Provider** - Build WorkflowEditorProvider
4. **Server Actions** - CRUD + save operations
5. **List Page** - Workflow list with create button
6. **Editor Shell** - Basic editor page with providers
7. **Canvas** - ReactFlow integration with custom nodes
8. **Sidebar** - Node palette for drag-and-drop
9. **Node Settings** - Config panel for selected node
10. **Publish Flow** - Toggle workflow active state
11. **Execution** - Basic workflow runner (Phase 2)

---

## Node Types - Initial Scope

**Phase 1 (MVP):**
- Trigger: CONTACT_FORM, MANUAL
- Action: CREATE_CONTACT, SEND_NOTIFICATION
- Condition: Simple if/else
- Wait: Delay execution

**Phase 2 (Expansion):**
- Email integration
- Pipeline/Ticket actions
- Webhook triggers/actions
- External integrations (Slack, Discord, etc.)

---

## Questions to Confirm

1. Start with SubAccount scope (vs Agency-level)?
2. Include execution engine in Phase 1, or just builder UI?
3. Keep existing Automation schema for backwards compatibility?

---

*Ready to implement on approval.*
