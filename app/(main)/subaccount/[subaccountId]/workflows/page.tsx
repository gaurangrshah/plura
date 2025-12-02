import { Suspense } from 'react';

import { addWorkflowsSidebarOption } from '@/lib/queries';
import { getWorkflows } from './_actions/workflow-actions';
import { WorkflowList } from './_components/workflow-list';
import { CreateWorkflowButton } from './_components/create-workflow-button';

type WorkflowsPageProps = {
  params: { subaccountId: string };
};

export default async function WorkflowsPage({ params }: WorkflowsPageProps) {
  // Ensure Workflows sidebar option exists for existing subaccounts
  await addWorkflowsSidebarOption(params.subaccountId);

  const workflows = await getWorkflows(params.subaccountId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Workflows</h1>
        <CreateWorkflowButton subAccountId={params.subaccountId} />
      </div>

      <p className="text-muted-foreground">
        Automate your business processes with visual workflows. Create triggers,
        conditions, and actions to streamline your operations.
      </p>

      <Suspense fallback={<WorkflowListSkeleton />}>
        <WorkflowList
          workflows={workflows}
          subAccountId={params.subaccountId}
        />
      </Suspense>
    </div>
  );
}

function WorkflowListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[180px] rounded-lg border bg-card animate-pulse"
        />
      ))}
    </div>
  );
}
