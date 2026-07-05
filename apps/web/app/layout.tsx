import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'LifeOS Core',
  description: 'LifeOS Core implementation monorepo',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
