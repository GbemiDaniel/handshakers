import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

export const metadata = {
  title: 'Handshakers — Team Time Tracking & Payout Management',
  description: 'Collaborate, track team hours seamlessly, and automate prorated payout calculations.',
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'Handshakers — Team Time Tracking & Payout Management',
    description: 'Collaborate, track team hours seamlessly, and automate prorated payout calculations.',
    url: 'https://handshakers.app',
    siteName: 'Handshakers',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Handshakers Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Handshakers',
    description: 'Team time tracking and prorated payout calculations.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('handshakers-theme');
                  var theme = stored || 'system';
                  var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full font-sans flex flex-col selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900/80 dark:selection:text-blue-200 transition-colors duration-200 ease-in-out dark:bg-[#0B0F19] dark:text-slate-200" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
