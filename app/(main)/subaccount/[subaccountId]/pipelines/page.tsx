import { redirect } from 'next/navigation';

import db from '@/lib/db';

type Props = {
  params: { subaccountId: string }
}

export default async function Pipelines({ params }: Props) {
  const pipelineExists = await db.pipeline.findFirst({
    where: { subAccountId: params.subaccountId },
  });

  if (pipelineExists) {

    return redirect(
      `/subaccount/${params.subaccountId}/pipelines/${pipelineExists.id}`
    );
  }


  try {
    const response = await db.pipeline.create({
      data: { name: 'First Pipeline', subAccountId: params.subaccountId },
    });


    return redirect(
      `/subaccount/${params.subaccountId}/pipelines/${response.id}`
    );
  } catch (error) {
    console.log(error);
  }
}
