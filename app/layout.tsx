import './globals.css';

import type { Metadata } from 'next';
import Script from 'next/script';

import { ModalProvider } from '@/providers/modal-provider';
import { ThemeProvider } from '@/providers/theme-provider';

// import { DM_Sans } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';

import { GeistSans } from 'geist/font/sans';

// const font = DM_Sans({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Plura',
  description: 'All-in-one agency solution',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <Script
          defer
          src="https://rarely-teens-obtaining-bloom.trycloudflare.com/script.js"
          data-website-id="031625d9-af73-4842-bc06-3a81e49df948"
          strategy="afterInteractive"
        />
      </head>
      <body className={GeistSans.className}>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <ModalProvider>
            {children}
            <Toaster />
          </ModalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
