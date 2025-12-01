import Image from 'next/image';
import Link from 'next/link';

import { ModeToggle } from '@/components/global/mode-toggle';
import { UserButton } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export default async function Navigation() {
  const user = await currentUser();

  return (
    <header className="absolute top-0 left-0 right-0 z-[100000] p-4 flex items-center justify-between">
      <aside className="flex items-center gap-2">
        <Image
          src="/assets/plura-logo.svg"
          alt="Plura logo"
          width={40}
          height={40}
        />
        <span className="text-xl font-bold z-10">Plura.</span>
      </aside>
      <nav className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <ul className="flex items-center gap-8">
          <li>
            <Link
              className={cn(
                buttonVariants({ variant: 'link' }),
                'text-inherit p-0 underline-offset-8'
              )}
              href="#"
            >
              Pricing
            </Link>
          </li>
          <li>
            <Link
              className={cn(
                buttonVariants({ variant: 'link' }),
                'text-inherit p-0 underline-offset-8'
              )}
              href="#"
            >
              About
            </Link>
          </li>
          <li>
            <Link
              className={cn(
                buttonVariants({ variant: 'link' }),
                'text-inherit p-0 underline-offset-8'
              )}
              href="#"
            >
              Documentation
            </Link>
          </li>
          <li>
            <Link
              className={cn(
                buttonVariants({ variant: 'link' }),
                'text-inherit p-0 underline-offset-8'
              )}
              href="#"
            >
              Features
            </Link>
          </li>
        </ul>
      </nav>
      <aside className="flex items-center gap-2">
        <Link href="/agency" className={cn(buttonVariants())}>
          {user ? 'Dashboard' : 'Get Started'}
        </Link>
        {user && <UserButton afterSignOutUrl="/" />}
        <ModeToggle />
      </aside>
    </header>
  );
}
