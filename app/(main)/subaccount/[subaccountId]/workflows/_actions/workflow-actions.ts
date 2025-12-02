'use server';

import { revalidatePath } from 'next/cache';

import db from '@/lib/db';
import {
  CreateWorkflowSchema,
  UpdateWorkflowSchema,
  parseNodes,
  parseEdges,
  computeFlowPath,
  type CreateWorkflowInput,
  type UpdateWorkflowInput,
  type EditorNode,
  type WorkflowEdge,
} from '@/lib/workflow-types';

// =============================================================================
// WORKFLOW CRUD
// =============================================================================

/**
 * Get all workflows for a subaccount
 */
export async function getWorkflows(subAccountId: string) {
  try {
    const workflows = await db.workflow.findMany({
      where: { subAccountId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { instances: true },
        },
      },
    });

    return workflows.map((w) => ({
      ...w,
      nodeCount: parseNodes(w.nodes).length,
      instanceCount: w._count.instances,
    }));
  } catch (error) {
    console.error('Failed to get workflows:', error);
    return [];
  }
}

/**
 * Get a single workflow by ID
 */
export async function getWorkflow(workflowId: string) {
  try {
    const workflow = await db.workflow.findUnique({
      where: { id: workflowId },
      include: {
        SubAccount: {
          select: { id: true, name: true },
        },
      },
    });

    if (!workflow) return null;

    return {
      ...workflow,
      parsedNodes: parseNodes(workflow.nodes),
      parsedEdges: parseEdges(workflow.edges),
    };
  } catch (error) {
    console.error('Failed to get workflow:', error);
    return null;
  }
}

/**
 * Create a new workflow
 */
export async function createWorkflow(
  subAccountId: string,
  data: CreateWorkflowInput
) {
  try {
    const validated = CreateWorkflowSchema.parse(data);

    // Create with a default trigger node
    const defaultNodes: EditorNode[] = [
      {
        id: crypto.randomUUID(),
        type: 'WorkflowNode',
        position: { x: 250, y: 100 },
        data: {
          title: 'Trigger',
          description: 'Start the workflow',
          completed: false,
          current: false,
          content: {
            nodeType: 'Trigger',
            triggerType: 'MANUAL',
          },
        },
      },
    ];

    const workflow = await db.workflow.create({
      data: {
        name: validated.name,
        description: validated.description || '',
        subAccountId,
        nodes: JSON.stringify(defaultNodes),
        edges: '[]',
      },
    });

    revalidatePath(`/subaccount/${subAccountId}/workflows`);

    return { success: true, workflow };
  } catch (error) {
    console.error('Failed to create workflow:', error);
    return { success: false, error: 'Failed to create workflow' };
  }
}

/**
 * Update a workflow
 */
export async function updateWorkflow(
  workflowId: string,
  data: UpdateWorkflowInput
) {
  try {
    const validated = UpdateWorkflowSchema.parse(data);

    const workflow = await db.workflow.update({
      where: { id: workflowId },
      data: {
        ...validated,
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/subaccount/${workflow.subAccountId}/workflows`);
    revalidatePath(
      `/subaccount/${workflow.subAccountId}/workflows/editor/${workflowId}`
    );

    return { success: true, workflow };
  } catch (error) {
    console.error('Failed to update workflow:', error);
    return { success: false, error: 'Failed to update workflow' };
  }
}

/**
 * Delete a workflow
 */
export async function deleteWorkflow(workflowId: string) {
  try {
    const workflow = await db.workflow.delete({
      where: { id: workflowId },
    });

    revalidatePath(`/subaccount/${workflow.subAccountId}/workflows`);

    return { success: true };
  } catch (error) {
    console.error('Failed to delete workflow:', error);
    return { success: false, error: 'Failed to delete workflow' };
  }
}

// =============================================================================
// WORKFLOW EDITOR OPERATIONS
// =============================================================================

/**
 * Save workflow nodes and edges
 */
export async function saveWorkflowNodes(
  workflowId: string,
  nodes: EditorNode[],
  edges: WorkflowEdge[]
) {
  try {
    // Compute the execution flow path
    const flowPath = computeFlowPath(nodes, edges);

    const workflow = await db.workflow.update({
      where: { id: workflowId },
      data: {
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        flowPath: JSON.stringify(flowPath),
        updatedAt: new Date(),
      },
    });

    return { success: true, workflow };
  } catch (error) {
    console.error('Failed to save workflow nodes:', error);
    return { success: false, error: 'Failed to save workflow' };
  }
}

/**
 * Get nodes and edges for a workflow (for editor loading)
 */
export async function getWorkflowNodesEdges(workflowId: string) {
  try {
    const workflow = await db.workflow.findUnique({
      where: { id: workflowId },
      select: {
        nodes: true,
        edges: true,
      },
    });

    if (!workflow) return null;

    return {
      nodes: parseNodes(workflow.nodes),
      edges: parseEdges(workflow.edges),
    };
  } catch (error) {
    console.error('Failed to get workflow nodes/edges:', error);
    return null;
  }
}

/**
 * Toggle workflow publish status
 */
export async function publishWorkflow(workflowId: string, publish: boolean) {
  try {
    const workflow = await db.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      return { success: false, error: 'Workflow not found' };
    }

    // Validate workflow has at least a trigger
    if (publish) {
      const nodes = parseNodes(workflow.nodes);
      const hasTrigger = nodes.some(
        (n) => n.data.content.nodeType === 'Trigger'
      );
      if (!hasTrigger) {
        return {
          success: false,
          error: 'Workflow must have a trigger node to be published',
        };
      }
    }

    const updated = await db.workflow.update({
      where: { id: workflowId },
      data: {
        published: publish,
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/subaccount/${updated.subAccountId}/workflows`);

    return {
      success: true,
      message: publish ? 'Workflow published' : 'Workflow unpublished',
    };
  } catch (error) {
    console.error('Failed to publish workflow:', error);
    return { success: false, error: 'Failed to update workflow status' };
  }
}

// =============================================================================
// WORKFLOW EXECUTION
// =============================================================================

/**
 * Trigger a workflow execution
 */
export async function executeWorkflow(
  workflowId: string,
  triggerType: string,
  triggerData: Record<string, any> = {}
) {
  try {
    const workflow = await db.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      return { success: false, error: 'Workflow not found' };
    }

    if (!workflow.published) {
      return { success: false, error: 'Workflow is not published' };
    }

    // Create execution instance
    const instance = await db.workflowInstance.create({
      data: {
        workflowId,
        status: 'pending',
        triggerType,
        triggerData: JSON.stringify(triggerData),
        logs: '[]',
      },
    });

    // TODO: Queue the workflow for async execution
    // For now, we'll execute synchronously in a simplified manner
    await runWorkflowInstance(instance.id);

    return { success: true, instanceId: instance.id };
  } catch (error) {
    console.error('Failed to execute workflow:', error);
    return { success: false, error: 'Failed to start workflow execution' };
  }
}

/**
 * Run a workflow instance (simplified sync execution)
 */
async function runWorkflowInstance(instanceId: string) {
  try {
    const instance = await db.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { Workflow: true },
    });

    if (!instance) return;

    // Update status to running
    await db.workflowInstance.update({
      where: { id: instanceId },
      data: { status: 'running' },
    });

    const nodes = parseNodes(instance.Workflow.nodes);
    const flowPath = instance.Workflow.flowPath
      ? JSON.parse(instance.Workflow.flowPath)
      : [];

    const logs: any[] = [];
    const triggerData = JSON.parse(instance.triggerData);

    // Execute nodes in order
    for (const nodeId of flowPath) {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) continue;

      logs.push({
        timestamp: new Date().toISOString(),
        nodeId,
        nodeType: node.data.content.nodeType,
        status: 'started',
        message: `Executing ${node.data.title}`,
      });

      try {
        // Execute node based on type
        await executeNode(node, triggerData, instance.Workflow.subAccountId);

        logs.push({
          timestamp: new Date().toISOString(),
          nodeId,
          nodeType: node.data.content.nodeType,
          status: 'completed',
          message: `Completed ${node.data.title}`,
        });
      } catch (nodeError: any) {
        logs.push({
          timestamp: new Date().toISOString(),
          nodeId,
          nodeType: node.data.content.nodeType,
          status: 'failed',
          message: nodeError.message || 'Node execution failed',
        });

        // Mark instance as failed
        await db.workflowInstance.update({
          where: { id: instanceId },
          data: {
            status: 'failed',
            error: nodeError.message,
            logs: JSON.stringify(logs),
            completedAt: new Date(),
          },
        });
        return;
      }
    }

    // Mark as completed
    await db.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: 'completed',
        logs: JSON.stringify(logs),
        completedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Workflow execution error:', error);
    await db.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
      },
    });
  }
}

/**
 * Execute a single node
 */
async function executeNode(
  node: EditorNode,
  triggerData: Record<string, any>,
  subAccountId: string
) {
  const { content } = node.data;

  switch (content.nodeType) {
    case 'Trigger':
      // Triggers just pass data through
      return;

    case 'Action':
      await executeActionNode(content, triggerData, subAccountId);
      return;

    case 'Wait':
      if (content.config) {
        const { duration, unit } = content.config;
        const ms = convertToMs(duration, unit);
        await new Promise((resolve) => setTimeout(resolve, ms));
      }
      return;

    case 'Notification':
      if (content.config?.message) {
        await db.notification.create({
          data: {
            notification: content.config.message,
            subAccountId,
            agencyId: '', // Will need to fetch this
            userId: '', // Will need to determine recipient
          },
        });
      }
      return;

    case 'Condition':
      // TODO: Implement condition evaluation
      // For now, always take the "true" path
      return;

    case 'Email':
      // TODO: Implement email sending
      console.log('Email node - not yet implemented');
      return;

    default: {
      // Exhaustive check - this should never happen
      const _exhaustiveCheck: never = content;
      console.log(`Unknown node type: ${(_exhaustiveCheck as any).nodeType}`);
    }
  }
}

/**
 * Execute an action node
 */
async function executeActionNode(
  content: any,
  triggerData: Record<string, any>,
  subAccountId: string
) {
  switch (content.actionType) {
    case 'CREATE_CONTACT':
      if (triggerData.name && triggerData.email) {
        await db.contact.create({
          data: {
            name: triggerData.name,
            email: triggerData.email,
            subAccountId,
          },
        });
      }
      break;

    case 'SEND_NOTIFICATION':
      if (content.config?.notificationMessage) {
        // TODO: Get agencyId and userId properly
        console.log('Notification:', content.config.notificationMessage);
      }
      break;

    case 'WEBHOOK':
      if (content.config?.webhookUrl) {
        await fetch(content.config.webhookUrl, {
          method: content.config.webhookMethod || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...content.config.webhookHeaders,
          },
          body: content.config.webhookBody || JSON.stringify(triggerData),
        });
      }
      break;

    default:
      console.log(`Unhandled action type: ${content.actionType}`);
  }
}

/**
 * Convert duration to milliseconds
 */
function convertToMs(
  duration: number,
  unit: 'seconds' | 'minutes' | 'hours' | 'days'
): number {
  const multipliers = {
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
  };
  return duration * multipliers[unit];
}

// =============================================================================
// WORKFLOW INSTANCES (execution history)
// =============================================================================

/**
 * Get execution instances for a workflow
 */
export async function getWorkflowInstances(
  workflowId: string,
  limit: number = 20
) {
  try {
    const instances = await db.workflowInstance.findMany({
      where: { workflowId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    return instances.map((i) => ({
      ...i,
      logs: JSON.parse(i.logs),
      triggerData: JSON.parse(i.triggerData),
    }));
  } catch (error) {
    console.error('Failed to get workflow instances:', error);
    return [];
  }
}

/**
 * Get a single workflow instance
 */
export async function getWorkflowInstance(instanceId: string) {
  try {
    const instance = await db.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { Workflow: true },
    });

    if (!instance) return null;

    return {
      ...instance,
      logs: JSON.parse(instance.logs),
      triggerData: JSON.parse(instance.triggerData),
    };
  } catch (error) {
    console.error('Failed to get workflow instance:', error);
    return null;
  }
}
