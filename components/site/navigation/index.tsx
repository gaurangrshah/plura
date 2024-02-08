import Image from 'next/image';
import Link from 'next/link';

import { ModeToggle } from '@/components/global/mode-toggle';
import { UserButton } from '@clerk/nextjs';
import { User } from '@clerk/nextjs/server';

type NavigationProps = {
  user?: null | User;
};

export default function Navigation({ user }: NavigationProps) {
  return (
    <div className='fixed left-0 right-0 top-0 z-10 flex items-center justify-between p-4'>
      <aside className='flex items-center gap-2'>
        <Image
          src='./assets/plura-logo.svg'
          alt='Plura logo'
          width={40}
          height={40}
        />
        <span className='text-xl font-bold'>Plura</span>
      </aside>
      <nav className='absolute left-[50%] top-[50%] hidden translate-x-[-50%] translate-y-[-50%] transform md:block'>
        <ul className='flex items-center justify-center gap-8'>
          <Link href={'#'}>Pricing</Link>
          <Link href={'#'}>About</Link>
          <Link href={'#'}>Documentation</Link>
          <Link href={'#'}>Features</Link>
        </ul>
      </nav>
      <aside className='flex items-center gap-2'>
        <Link
          href={'/agency'}
          className='rounded-md bg-primary p-2 px-4 text-white hover:bg-primary/80'
        >
          Log in
        </Link>
        <UserButton />
        <ModeToggle />
      </aside>
    </div>
  );
}
