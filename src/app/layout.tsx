import type { Metadata } from 'next';
import { Theme } from '@radix-ui/themes';
import './globals.css';
import { Providers } from './providers';
import { GlobalAIAssistant } from '@/src/components/GlobalAIAssistant';

export const metadata: Metadata = {
  title: 'AIClass - Student Performance Management',
  description: 'AI-powered student performance tracking and recommendations',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Theme accentColor="blue" grayColor="slate" radius="medium" scaling="100%">
            {children}
            <GlobalAIAssistant />
          </Theme>
        </Providers>
      </body>
    </html>
  );
}
