import React from 'react';

import { notFound } from 'next/navigation';

import { EditorProvider } from '@/providers/editor/editor-provider';

import db from '@/lib/db';
import { getDomainContent } from '@/lib/queries';

import {
  FunnelEditor,
} from '../(main)/subaccount/[subaccountId]/funnels/[funnelId]/editor/[funnelPageId]/_components/funnel-editor';

const Page = async ({ params }: { params: { domain: string } }) => {
  const domainData = await getDomainContent(params.domain.slice(0, -1))
  if (!domainData) return notFound()

  // determine which pages to show
  const pageData = domainData.FunnelPages.find((page) => !page.pathName)

  if (!pageData) return notFound()

  await db.funnelPage.update({
    where: {
      id: pageData.id,
    },
    data: {
      visits: {
        increment: 1,
      },
    },
  })

  return (
    <EditorProvider
      subaccountId={domainData.subAccountId}
      pageDetails={pageData}
      funnelId={domainData.id}
    >
      <FunnelEditor
        funnelPageId={pageData.id}
        liveMode={true}
      />
    </EditorProvider>
  )
}

export default Page
