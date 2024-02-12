'use client'
import React from 'react';

import { useModal } from '@/providers/modal-provider';

import { ContactUserForm } from '@/components/forms/contact-user-form';
import CustomModal from '@/components/global/custom-modal';
import { Button } from '@/components/ui/button';

type CreateContactButtonProps = {
  subaccountId: string
}

export function CreateContactButton ({ subaccountId }: CreateContactButtonProps) {
  const { setOpen } = useModal()

  const handleCreateContact = async () => {
    setOpen(
      <CustomModal
        title="Create Or Update Contact information"
        subheading="Contacts are like customers."
      >
        <ContactUserForm subaccountId={subaccountId} />
      </CustomModal>
    )
  }

  return <Button onClick={handleCreateContact}>Create Contact</Button>
}
