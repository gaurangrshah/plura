import { redirect } from 'next/navigation';

import { Unauthorized } from '@/components/unauthorized';

import {
  getAuthUserDetails,
  verifyAndAcceptInvitation,
} from '@/lib/queries';

type Props = {
  searchParams: { state: string; code: string }
}

const SubAccountMainPage = async ({ searchParams }: Props) => {
  const agencyId = await verifyAndAcceptInvitation()

  if (!agencyId) {
    return <Unauthorized />
  }

  const user = await getAuthUserDetails()
  if (!user) return

  const getFirstSubaccountWithAccess = user.Permissions.find(
    // find the first subaccount that the user has access to
    (permission) => permission.access === true
  )

  if (searchParams.state) {
    const [statePath, stateSubaccountId] = searchParams.state.split('___')
    if (!stateSubaccountId) return <Unauthorized />
    return redirect(
      // redirect to the subaccount page with the code from stripe
      `/subaccount/${stateSubaccountId}/${statePath}?code=${searchParams.code}`
    )
  }

  if (getFirstSubaccountWithAccess) {
    // redirect to the first subaccount that the user has access to
    return redirect(`/subaccount/${getFirstSubaccountWithAccess.subAccountId}`)
  }

  return <Unauthorized />
}

export default SubAccountMainPage
