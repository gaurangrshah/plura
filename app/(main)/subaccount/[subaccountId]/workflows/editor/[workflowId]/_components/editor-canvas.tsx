'use client';

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Connection,
  Edge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  ReactFlowProvider,
} from 'reactflow';

import 'reactflow/dist/style.css';

import { useWorkflowEditor } from '@/providers/workflow-editor-provider';
import type { EditorNode, WorkflowEdge } from '@/lib/workflow-types';

import { WorkflowNode } from './workflow-node';

// Register custom node types
const nodeTypes = {
  WorkflowNode: WorkflowNode,
};

function EditorCanvasInner() {
  const { state, dispatch } = useWorkflowEditor();

  // Convert our node format to ReactFlow format
  const nodes = useMemo(
    () =>
      state.elements.map((node) => ({
        ...node,
        type: 'WorkflowNode',
        selected: node.id === state.selectedNode?.id,
      })),
    [state.elements, state.selectedNode]
  );

  const edges = useMemo(
    () =>
      state.edges.map((edge) => ({
        ...edge,
        type: 'smoothstep',
        animated: true,
      })),
    [state.edges]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Handle position changes, selection, etc.
      const updatedNodes = applyNodeChanges(changes, nodes) as EditorNode[];

      // Only dispatch if there are actual changes to positions
      const positionChanges = changes.filter(
        (c) => c.type === 'position' && c.position
      );
      if (positionChanges.length > 0) {
        dispatch({
          type: 'LOAD_DATA',
          payload: {
            elements: updatedNodes,
            edges: state.edges,
          },
        });
      }

      // Handle selection
      const selectionChanges = changes.filter((c) => c.type === 'select');
      for (const change of selectionChanges) {
        if (change.type === 'select') {
          const node = state.elements.find((n) => n.id === change.id);
          if (change.selected && node) {
            dispatch({ type: 'SELECT_NODE', payload: { node } });
          } else if (!change.selected && state.selectedNode?.id === change.id) {
            dispatch({ type: 'SELECT_NODE', payload: { node: null } });
          }
        }
      }
    },
    [nodes, state.edges, state.elements, state.selectedNode, dispatch]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updatedEdges = applyEdgeChanges(
        changes,
        edges
      ) as unknown as WorkflowEdge[];
      dispatch({ type: 'UPDATE_EDGES', payload: updatedEdges });
    },
    [edges, dispatch]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      // Prevent connecting a node to itself
      if (connection.source === connection.target) return;

      const newEdge: WorkflowEdge = {
        id: `${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle || undefined,
        targetHandle: connection.targetHandle || undefined,
      };

      dispatch({ type: 'ADD_EDGE', payload: newEdge });
    },
    [dispatch]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData('application/reactflow');
      if (!nodeType) return;

      // Get drop position
      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      // Parse the node data
      try {
        const nodeData = JSON.parse(nodeType);

        // Prevent multiple triggers
        if (nodeData.content.nodeType === 'Trigger') {
          const existingTrigger = state.elements.find(
            (n) => n.data.content.nodeType === 'Trigger'
          );
          if (existingTrigger) {
            alert('Only one trigger can be added to a workflow.');
            return;
          }
        }

        const newNode: EditorNode = {
          id: crypto.randomUUID(),
          type: 'WorkflowNode',
          position,
          data: nodeData,
        };

        dispatch({ type: 'ADD_NODE', payload: newNode });
      } catch {
        console.error('Failed to parse dropped node data');
      }
    },
    [state.elements, dispatch]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        className="bg-muted/50"
      >
        <Background gap={15} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const nodeData = node.data as EditorNode['data'];
            switch (nodeData?.content?.nodeType) {
              case 'Trigger':
                return '#22c55e';
              case 'Action':
                return '#3b82f6';
              case 'Condition':
                return '#f59e0b';
              case 'Wait':
                return '#8b5cf6';
              case 'Email':
                return '#ec4899';
              case 'Notification':
                return '#06b6d4';
              default:
                return '#6b7280';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}

export function EditorCanvas() {
  return (
    <ReactFlowProvider>
      <EditorCanvasInner />
    </ReactFlowProvider>
  );
}
