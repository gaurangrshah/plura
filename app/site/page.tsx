import clsx from 'clsx';
import { Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import {
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card';
import { pricingCards } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function Home() {
  return (
    <>
      <section className='relative flex h-full w-full flex-col items-center justify-center pt-36'>
        <div className='absolute bottom-0 left-0 right-0 top-0 -z-10 bg-[linear-gradient(to_right,#161616_1px,transparent_1px),linear-gradient(to_bottom,#161616_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]'>
          <p className='text-center'>Run your agency, in one place</p>
          <div className='relative bg-gradient-to-r from-primary to-secondary-foreground bg-clip-text text-transparent'>
            <h1 className='text-center text-9xl font-bold md:text-[300px]'>
              Plura
            </h1>
          </div>
        </div>
        <div className='relative flex flex-col items-center justify-center md:mt-[-70px]'>
          <Image
            src='/assets/preview.png'
            alt='Hero'
            width={1200}
            height={1200}
            className='rounded-tl-2xl rounded-tr-2xl border-2 border-muted'
          />
          <div className='absolute bottom-0 left-0 right-0 top-[50%] z-10 bg-gradient-to-t dark:from-background'></div>
        </div>
      </section>

      <section className='mt-[-60px] flex flex-col items-center justify-center gap-4 md:!mt-20'>
        <h2 className='text-center text-4xl'>Choose what fits you right</h2>
        <p className='text-center text-muted-foreground'>
          Our straightforward pricing plans are tailored to meet your needs. If{' '}
          {" you're"} not <br /> ready to commit you can get started for free.
        </p>
        <div className='mt-6 flex flex-wrap justify-center gap-4'>
          {pricingCards.map((card) => (
            // @TODO: wireup free plan from stripe
            <Card
              key={card.title}
              className={cn(
                'flex w-[300px] flex-col items-center justify-between',
                card.title === 'Unlimited Saas' && 'border-2 border-primary'
              )}
            >
              <CardHeader>
                <CardTitle
                  className={cn(
                    card.title !== 'Unlimited Saas' && 'text-muted-foreground'
                  )}
                >
                  {card.title}
                </CardTitle>
                <CardDescription></CardDescription>
              </CardHeader>
              <CardContent>
                <span className='text-4xl font-bold'>{card.price}</span>
                <span className='text-muted-foreground'>/m</span>
              </CardContent>
              <CardFooter className='flex flex-col items-center gap-4'>
                {card.features.map((feature) => (
                  <div key={feature} className='flex justify-center gap-2'>
                    <Check />
                    <p className='text-muted-foreground'>{feature}</p>
                  </div>
                ))}
                <Link
                  href={`/agency?plan=${card.priceId}`}
                  className={cn(
                    'w-full rounded-md bg-primary p-2 text-center',
                    card.title !== 'Unlimited Saas' && '!bg-muted-foreground'
                  )}
                >
                  Get Started
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
