import { getAuthUserDetails } from '@/lib/queries';

import { MenuOptions } from './menu-options';

type SidebarProps = {
  id: string;
  type: 'agency' | 'subaccount';
};

export async function Sidebar({ id, type }: SidebarProps) {
  const user = await getAuthUserDetails();
  if (!user || !user.Agency) return null;

  const details =
    type === 'agency'
      ? user?.Agency
      : user?.Agency.SubAccount.find((subacct) => subacct.id === id);

  const isWhiteLabeledAgency = user.Agency.whiteLabel;

  if (!details) return null;

  let sideBarLogo: string | undefined =
    user.Agency.agencyLogo || '/assets/plura-logo.svg';

  if (!isWhiteLabeledAgency) {
    if (type === 'subaccount') {
      sideBarLogo =
        user?.Agency.SubAccount.find((subacct) => subacct.id === id)
          ?.subAccountLogo || user.Agency.agencyLogo;
    }
    sideBarLogo = user.Agency.agencyLogo;
  }

  const sidebarOpt =
    type === 'agency'
      ? user.Agency.SidebarOption || []
      : user?.Agency.SubAccount.find((subacct) => subacct.id === id)
        ?.SidebarOption || [];

  const subaccounts = user.Agency.SubAccount.filter((subacct) =>
    user.Permissions.find(
      (permission) =>
        permission.subAccountId === subacct.id && permission.access
    )
  );

  return (
    <>
      <MenuOptions
        defaultOpen={true}
        id={id}
        sidebarLogo={sideBarLogo}
        sidebarOpt={sidebarOpt}
        subAccounts={subaccounts}
        user={user}
        details={{}}
      />

      {/* Mobile Nav */}
      <MenuOptions
        details={details}
        id={id}
        sidebarLogo={sideBarLogo}
        sidebarOpt={sidebarOpt}
        subAccounts={subaccounts}
        user={user}
      />
    </>
  );
}
