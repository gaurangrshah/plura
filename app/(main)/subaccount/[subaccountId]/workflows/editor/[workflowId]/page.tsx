import { notFound } from 'next/navigation';

import { getWorkflow } from '../../_actions/workflow-actions';
import { WorkflowEditorProvider } from '@/providers/workflow-editor-provider';
import { EditorCanvas } from './_components/editor-canvas';
import { EditorSidebar } from './_components/editor-sidebar';
import { EditorToolbar } from './_components/editor-toolbar';

type WorkflowEditorPageProps = {
  params: {
    subaccountId: string;
    workflowId: string;
  };
};

export default async function WorkflowEditorPage({
  params,
}: WorkflowEditorPageProps) {
  const workflow = await getWorkflow(params.workflowId);

  if (!workflow) {
    notFound();
  }

  return (
    <WorkflowEditorProvider
      initialNodes={workflow.parsedNodes}
      initialEdges={workflow.parsedEdges}
    >
      <div className="flex h-[calc(100vh-80px)] flex-col">
        <EditorToolbar
          workflowId={workflow.id}
          workflowName={workflow.name}
          published={workflow.published}
          subAccountId={params.subaccountId}
        />

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1">
            <EditorCanvas />
          </div>
          <EditorSidebar workflowId={workflow.id} />
        </div>
      </div>
    </WorkflowEditorProvider>
  );
}
