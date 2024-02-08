import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>{children}</ClerkProvider>
  );
}
