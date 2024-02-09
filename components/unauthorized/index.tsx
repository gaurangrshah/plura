import Link from 'next/link';

type UnauthorizedProps = {};

export function Unauthorized(props: UnauthorizedProps) {
  return (
    <div className='flex h-screen w-screen flex-col items-center justify-center p-4 text-center'>
      <h1 className='text-3xl md:text-6xl'>Unauthorized acccess!</h1>
      <p>Please contact support or your agency owner to get access</p>
      <Link href='/' className='mt-4 bg-primary p-2'>
        Back to home
      </Link>
    </div>
  );
}
