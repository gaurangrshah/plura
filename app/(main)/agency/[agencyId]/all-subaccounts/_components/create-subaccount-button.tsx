'use client';

import {
  Agency,
  AgencySidebarOption,
  SubAccount,
  User,
} from '@prisma/client';

import { PlusCircleIcon } from 'lucide-react';

import { useModal } from '@/providers/modal-provider';

import { SubAccountDetails } from '@/components/forms/subaccount-details';
import CustomModal from '@/components/global/custom-modal';
import { Button } from '@/components/ui/button';

import { twMerge } from 'tailwind-merge';

type Props = {
  user: User & {
    // The Agency property can be either an object of type Agency or a nullable object with additional properties SubAccount and SideBarOption.
    Agency:
    | (
      | Agency
      | (null & {
        SubAccount: SubAccount[]
        SideBarOption: AgencySidebarOption[]
      })
    )
    | null
  }
  id: string
  className: string
}

export const CreateSubaccountButton = ({ className, id, user }: Props) => {
  const { setOpen } = useModal()
  const agencyDetails = user.Agency

  if (!agencyDetails) return

  return (
    <Button
      className={twMerge('w-full flex gap-4', className)}
      onClick={() => {
        setOpen(
          <CustomModal
            title="Create a Subaccount"
            subheading="You can switch between"
          >
            <SubAccountDetails
              agencyDetails={agencyDetails}
              userId={user.id}
              userName={user.name}
            />
          </CustomModal>
        )
      }}
    >
      <PlusCircleIcon size={15} />
      Create Sub Account
    </Button>
  )
}
