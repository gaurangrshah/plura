'use client'

import { useState, useEffect } from 'react';

import Link from 'next/link';

import { FunnelPage } from '@prisma/client';

import {
  Check,
  ExternalLink,
  LucideEdit,
} from 'lucide-react';

import {
  DragDropContext,
  DragStart,
  Droppable,
  DropResult,
} from '@hello-pangea/dnd';

import { useModal } from '@/providers/modal-provider';

import { CreateFunnelPage } from '@/components/forms/funnel-page';
import CustomModal from '@/components/global/custom-modal';
import {
  FunnelPagePlaceholder,
} from '@/components/icons/funnel-page-placeholder';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';

import { upsertFunnelPage } from '@/lib/queries';
import { FunnelsForSubAccount } from '@/lib/types';

import { FunnelStepCard } from './funnel-step-card';

type FunnelStepsProps = {
  funnel: FunnelsForSubAccount
  subaccountId: string
  pages: FunnelPage[]
  funnelId: string
}

export function FunnelSteps({ funnel, funnelId, pages, subaccountId }: FunnelStepsProps) {
  // persist selected funnel page
  const [clickedPage, setClickedPage] = useState<FunnelPage | undefined>(
    pages[0]
  )
  const { setOpen } = useModal()
  const [pagesState, setPagesState] = useState(pages) // all pages from funnel

  // Sync state when pages prop changes (after router.refresh())
  useEffect(() => {
    setPagesState(pages);
    // Update clickedPage if it was modified, or set to first page if not set
    if (clickedPage) {
      const updatedPage = pages.find(p => p.id === clickedPage.id);
      if (updatedPage) {
        setClickedPage(updatedPage);
      } else if (pages.length > 0) {
        setClickedPage(pages[0]);
      }
    } else if (pages.length > 0) {
      setClickedPage(pages[0]);
    }
  }, [pages]);

  const funnelPageUrl = `${process.env.NEXT_PUBLIC_SCHEME}${funnel.subDomainName}.${process.env.NEXT_PUBLIC_DOMAIN}/${clickedPage?.pathName}`;

  const onDragStart = (event: DragStart) => {
    //current chosen page
    const { draggableId } = event
    const value = pagesState.find((page) => page.id === draggableId)
  }

  const onDragEnd = (dropResult: DropResult) => {
    const { destination, source } = dropResult

    //no destination or same position
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return
    }
    //change state
    const newPageOrder = [...pagesState]
      .toSpliced(source.index, 1)
      .toSpliced(destination.index, 0, pagesState[source.index])
      .map((page, idx) => {
        return { ...page, order: idx }
      })

    setPagesState(newPageOrder)
    newPageOrder.forEach(async (page, index) => {
      try {
        await upsertFunnelPage(
          subaccountId,
          {
            id: page.id,
            order: index,
            name: page.name,
          },
          funnelId
        )
      } catch (error) {
        console.log(error)
        toast({
          variant: 'destructive',
          title: 'Failed',
          description: 'Could not save page order',
        })
        return
      }
    })

    toast({
      title: 'Success',
      description: 'Saved page order',
    })
  }

  return (
    <AlertDialog>
      <div className="flex border-[1px] lg:!flex-row flex-col ">
        <aside className="flex-[0.3] bg-background p-6  flex flex-col justify-between ">
          <ScrollArea className="h-full ">
            <div className="flex gap-4 items-center">
              <Check />
              Funnel Steps
            </div>
            {pagesState.length ? (
              <DragDropContext
                onDragEnd={onDragEnd}
                onDragStart={onDragStart}
              >
                <Droppable
                  droppableId="funnels"
                  direction="vertical"
                  key="funnels"
                >
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {pagesState.map((page, idx) => (
                        <div
                          className="relative"
                          key={page.id}
                          onClick={() => setClickedPage(page)}
                        >
                          <FunnelStepCard
                            funnelPage={page}
                            index={idx}
                            key={page.id}
                            activePage={page.id === clickedPage?.id}
                          />
                        </div>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <div className="text-center text-muted-foreground py-6">
                No Pages
              </div>
            )}
          </ScrollArea>
          <Button
            className="mt-4 w-full"
            onClick={() => {
              setOpen(
                <CustomModal
                  title=" Create or Update a Funnel Page"
                  subheading="Funnel Pages allow you to create step by step processes for customers to follow"
                >
                  <CreateFunnelPage
                    subaccountId={subaccountId}
                    funnelId={funnelId}
                    order={pagesState.length}
                  />
                </CustomModal>
              )
            }}
          >
            Create New Steps
          </Button>
        </aside>
        <aside className="flex-[0.7] bg-muted p-4 ">
          {!!pages.length ? (
            <Card className="h-full flex justify-between flex-col">
              <CardHeader>
                <p className="text-sm text-muted-foreground">Page name</p>
                <CardTitle>{clickedPage?.name}</CardTitle>
                <p className="text-xs">{clickedPage?.id}</p>
                <div className="flex flex-col gap-4">
                  <div className="border-2 rounded-lg sm:w-80 w-full  overflow-clip">
                    {clickedPage?.id ? (
                    <Link
                      href={`/subaccount/${subaccountId}/funnels/${funnelId}/editor/${clickedPage.id}`}
                      className="group block"
                    >
                      <div className="relative cursor-pointer w-full">
                        <div className="group-hover:opacity-30 transition-opacity duration-100">
                          <FunnelPagePlaceholder />
                        </div>
                        <LucideEdit
                          size={50}
                          className="!text-muted-foreground absolute top-1/2 left-1/2 opacity-0 -translate-x-1/2 -translate-y-1/2 group-hover:opacity-100 transition-opacity duration-100"
                        />
                      </div>
                    </Link>
                    ) : (
                      <div className="cursor-pointer w-full">
                        <FunnelPagePlaceholder />
                      </div>
                    )}

                    <Link
                      target="_blank"
                      href={funnelPageUrl}
                      className="group flex items-center justify-start p-2 gap-2 hover:text-primary transition-colors duration-200"
                    >
                      <ExternalLink size={15} />
                      <div className="w-64 overflow-hidden overflow-ellipsis ">
                        {funnelPageUrl}
                      </div>
                    </Link>
                  </div>

                  <CreateFunnelPage
                    subaccountId={subaccountId}
                    defaultData={clickedPage}
                    funnelId={funnelId}
                    order={pagesState.findIndex(p => p.id === clickedPage?.id)}
                  />
                </div>
              </CardHeader>
            </Card>
          ) : (
            <div className="h-[600px] flex items-center justify-center text-muted-foreground">
              Create a page to view page settings.
            </div>
          )}
        </aside>
      </div>
    </AlertDialog>
  )
}
