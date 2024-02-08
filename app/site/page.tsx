import Image from 'next/image';

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
          <Image src='/images/hero.svg' alt='Hero' width={500} height={500} />
          <p className='mt-4 text-2xl font-bold'>
            The only tool you need to run your agency
          </p>
        </div>
      </section>
    </>
  );
}
