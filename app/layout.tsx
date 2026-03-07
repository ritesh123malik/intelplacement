// app/layout.tsx
import type { Metadata } from 'next';
import { Syne, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AIFloatingButton from '@/components/ai/AIFloatingButton';

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PlacementIntel — Know What Companies Ask Before They Ask You',
  description: 'AI-powered interview prep. Company-wise questions, resume scoring, and personalized roadmaps for top tech placements.',
  keywords: 'placement preparation, interview questions, resume analyzer, DSA roadmap, Google interview, Microsoft interview',
  openGraph: {
    title: 'PlacementIntel',
    description: 'AI-powered placement preparation for engineering students.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen flex flex-col bg-bg text-text-primary`}>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <div className="relative flex flex-col min-h-screen">
          <Navbar />
          <main id="main-content" className="flex-grow">
            {children}
          </main>
          <AIFloatingButton />
          <Footer />
        </div>
      </body>
    </html>
  );
}
