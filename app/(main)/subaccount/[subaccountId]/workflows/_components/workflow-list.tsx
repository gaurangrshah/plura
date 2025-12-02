'use client';

import { WorkflowCard } from './workflow-card';

type WorkflowWithMeta = {
  id: string;
  name: string;
  description: string;
  published: boolean;
  nodeCount: number;
  instanceCount: number;
  createdAt: Date;
  updatedAt: Date;
};

type WorkflowListProps = {
  workflows: WorkflowWithMeta[];
  subAccountId: string;
};

export function WorkflowList({ workflows, subAccountId }: WorkflowListProps) {
  if (workflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold">No workflows yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first workflow to start automating tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {workflows.map((workflow) => (
        <WorkflowCard
          key={workflow.id}
          workflow={workflow}
          subAccountId={subAccountId}
        />
      ))}
    </div>
  );
}
