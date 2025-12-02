'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
  type Dispatch,
} from 'react';

import type {
  EditorNode,
  WorkflowEdge,
  EditorState,
  EditorAction,
} from '@/lib/workflow-types';

// =============================================================================
// STATE TYPES
// =============================================================================

type HistoryState = {
  past: EditorState[];
  present: EditorState;
  future: EditorState[];
};

type EditorContextType = {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
  // Convenience methods
  canUndo: boolean;
  canRedo: boolean;
  selectedNode: EditorNode | null;
  // Helper functions
  getNode: (id: string) => EditorNode | undefined;
  getConnectedNodes: (nodeId: string) => EditorNode[];
};

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialEditorState: EditorState = {
  elements: [],
  edges: [],
  selectedNode: null,
};

const initialHistoryState: HistoryState = {
  past: [],
  present: initialEditorState,
  future: [],
};

const MAX_HISTORY_LENGTH = 50;

// =============================================================================
// REDUCER
// =============================================================================

function editorReducer(state: HistoryState, action: EditorAction): HistoryState {
  const { past, present, future } = state;

  switch (action.type) {
    case 'LOAD_DATA': {
      const newPresent: EditorState = {
        elements: action.payload.elements,
        edges: action.payload.edges,
        selectedNode: null,
      };
      return {
        past: [],
        present: newPresent,
        future: [],
      };
    }

    case 'ADD_NODE': {
      const newPresent: EditorState = {
        ...present,
        elements: [...present.elements, action.payload],
        selectedNode: action.payload,
      };
      return {
        past: [...past.slice(-MAX_HISTORY_LENGTH + 1), present],
        present: newPresent,
        future: [],
      };
    }

    case 'UPDATE_NODE': {
      const newPresent: EditorState = {
        ...present,
        elements: present.elements.map((el) =>
          el.id === action.payload.id ? action.payload : el
        ),
        selectedNode:
          present.selectedNode?.id === action.payload.id
            ? action.payload
            : present.selectedNode,
      };
      return {
        past: [...past.slice(-MAX_HISTORY_LENGTH + 1), present],
        present: newPresent,
        future: [],
      };
    }

    case 'DELETE_NODE': {
      const nodeId = action.payload.id;
      const newPresent: EditorState = {
        ...present,
        elements: present.elements.filter((el) => el.id !== nodeId),
        edges: present.edges.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId
        ),
        selectedNode:
          present.selectedNode?.id === nodeId ? null : present.selectedNode,
      };
      return {
        past: [...past.slice(-MAX_HISTORY_LENGTH + 1), present],
        present: newPresent,
        future: [],
      };
    }

    case 'SELECT_NODE': {
      // Selection doesn't affect history
      return {
        ...state,
        present: {
          ...present,
          selectedNode: action.payload.node,
        },
      };
    }

    case 'UPDATE_EDGES': {
      const newPresent: EditorState = {
        ...present,
        edges: action.payload,
      };
      return {
        past: [...past.slice(-MAX_HISTORY_LENGTH + 1), present],
        present: newPresent,
        future: [],
      };
    }

    case 'ADD_EDGE': {
      // Prevent duplicate edges
      const exists = present.edges.some(
        (e) =>
          e.source === action.payload.source &&
          e.target === action.payload.target
      );
      if (exists) return state;

      const newPresent: EditorState = {
        ...present,
        edges: [...present.edges, action.payload],
      };
      return {
        past: [...past.slice(-MAX_HISTORY_LENGTH + 1), present],
        present: newPresent,
        future: [],
      };
    }

    case 'DELETE_EDGE': {
      const newPresent: EditorState = {
        ...present,
        edges: present.edges.filter((e) => e.id !== action.payload.id),
      };
      return {
        past: [...past.slice(-MAX_HISTORY_LENGTH + 1), present],
        present: newPresent,
        future: [],
      };
    }

    case 'UNDO': {
      if (past.length === 0) return state;
      const previous = past[past.length - 1];
      const newPast = past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [present, ...future],
      };
    }

    case 'REDO': {
      if (future.length === 0) return state;
      const next = future[0];
      const newFuture = future.slice(1);
      return {
        past: [...past, present],
        present: next,
        future: newFuture,
      };
    }

    case 'CLEAR': {
      return {
        past: [...past.slice(-MAX_HISTORY_LENGTH + 1), present],
        present: initialEditorState,
        future: [],
      };
    }

    default:
      return state;
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

const WorkflowEditorContext = createContext<EditorContextType | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

type WorkflowEditorProviderProps = {
  children: ReactNode;
  initialNodes?: EditorNode[];
  initialEdges?: WorkflowEdge[];
};

export function WorkflowEditorProvider({
  children,
  initialNodes = [],
  initialEdges = [],
}: WorkflowEditorProviderProps) {
  const [historyState, dispatch] = useReducer(editorReducer, {
    past: [],
    present: {
      elements: initialNodes,
      edges: initialEdges,
      selectedNode: null,
    },
    future: [],
  });

  const { past, present, future } = historyState;

  const getNode = useCallback(
    (id: string) => present.elements.find((el) => el.id === id),
    [present.elements]
  );

  const getConnectedNodes = useCallback(
    (nodeId: string) => {
      const connectedIds = present.edges
        .filter((e) => e.source === nodeId || e.target === nodeId)
        .flatMap((e) => [e.source, e.target])
        .filter((id) => id !== nodeId);

      return present.elements.filter((el) => connectedIds.includes(el.id));
    },
    [present.elements, present.edges]
  );

  const value: EditorContextType = {
    state: present,
    dispatch,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    selectedNode: present.selectedNode,
    getNode,
    getConnectedNodes,
  };

  return (
    <WorkflowEditorContext.Provider value={value}>
      {children}
    </WorkflowEditorContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useWorkflowEditor() {
  const context = useContext(WorkflowEditorContext);
  if (!context) {
    throw new Error(
      'useWorkflowEditor must be used within a WorkflowEditorProvider'
    );
  }
  return context;
}

// =============================================================================
// CONVENIENCE HOOKS
// =============================================================================

/**
 * Hook to get just the nodes
 */
export function useWorkflowNodes() {
  const { state } = useWorkflowEditor();
  return state.elements;
}

/**
 * Hook to get just the edges
 */
export function useWorkflowEdges() {
  const { state } = useWorkflowEditor();
  return state.edges;
}

/**
 * Hook to get the selected node
 */
export function useSelectedNode() {
  const { selectedNode } = useWorkflowEditor();
  return selectedNode;
}

/**
 * Hook for undo/redo controls
 */
export function useWorkflowHistory() {
  const { dispatch, canUndo, canRedo } = useWorkflowEditor();

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, [dispatch]);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, [dispatch]);

  return { undo, redo, canUndo, canRedo };
}
