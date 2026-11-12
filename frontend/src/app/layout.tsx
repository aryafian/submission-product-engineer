import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'NodeWave — Project Deliverables Management System',
  description: 'Enterprise deliverable management with dependency tracking, state-based permissions, and client tenant isolation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#F9FAFB] text-[#111827] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
