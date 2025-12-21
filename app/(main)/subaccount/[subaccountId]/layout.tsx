import { redirect } from 'next/navigation';

import { currentUser } from '@clerk/nextjs/server';

import type { Role } from '@/lib/types';

import { InfoBar } from '@/components/global/info-bar';
import { Sidebar } from '@/components/sidebar';
import { Unauthorized } from '@/components/unauthorized';

import {
  getAuthUserDetails,
  getNotificationAndUser,
  verifyAndAcceptInvitation,
} from '@/lib/queries';

type Props = {
  children: React.ReactNode
  params: { subaccountId: string }
}

export default async function SubaccountLayout({ children, params }: Props) {
  const agencyId = await verifyAndAcceptInvitation()
  if (!agencyId) return <Unauthorized />
  const user = await currentUser()
  if (!user) {
    return redirect('/')
  }

  let notifications: any = []

  if (!user.privateMetadata.role) {
    return <Unauthorized />
  } else {
    const allPermissions = await getAuthUserDetails()
    const hasPermission = allPermissions?.Permissions.find(
      (permissions) => !!permissions.access && permissions.subAccountId === params.subaccountId
    )
    if (!hasPermission) {
      return <Unauthorized />
    }

    const allNotifications = await getNotificationAndUser(agencyId)

    if (user.privateMetadata.role === 'AGENCY_ADMIN' ||
      user.privateMetadata.role === 'AGENCY_OWNER') {
      // if the user is an agency admin or owner, show all notifications
      notifications = allNotifications
    } else {
      // if the user is a subaccount user, show only the notifications for that subaccount
      const filteredNoti = allNotifications?.filter(
        (item) => item.subAccountId === params.subaccountId
      )
      if (filteredNoti) notifications = filteredNoti
    }
  }

  return (
    <div className="h-screen overflow-hidden">
      <Sidebar
        id={params.subaccountId}
        type="subaccount" />

      <div className="md:pl-[300px]">
        <InfoBar
          notifications={notifications}
          role={user.privateMetadata.role as Role}
          subAccountId={params.subaccountId as string} />
        <div className="relative">{children}</div>
      </div>
    </div>
  )
}
