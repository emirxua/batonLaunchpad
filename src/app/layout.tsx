import type { Metadata, Viewport } from "next";
import { Archivo_Black, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "@/styles/wallet-adapter-custom.css";
import { WalletContextProvider } from "@/components/WalletContextProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://outbid.bond"),
  title: "OUTBID.BOND — Solana Alpha Terminal & Attention Engine",
  description:
    "Real-time spot market pulse, curated high-momentum Solana movers (MCap > $70K), on-chain Jupiter DEX swaps, and $BATON attention auction mechanics.",
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://outbid.bond",
  },
  openGraph: {
    siteName: "outbid.bond",
    url: "https://outbid.bond",
    title: "OUTBID.BOND | Solana Alpha Terminal",
    description:
      "Real-time spot market pulse, curated high-momentum Solana movers (MCap > $70K), on-chain Jupiter DEX swaps, and $BATON attention auction mechanics.",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OUTBID.BOND | Solana Alpha Terminal",
    description:
      "Real-time spot market pulse, curated high-momentum Solana movers (MCap > $70K), on-chain Jupiter DEX swaps, and $BATON attention auction mechanics.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Outbid",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivoBlack.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Outbid" />
      </head>
      <body className="bg-bg text-text antialiased min-h-screen selection:bg-acid selection:text-bg">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <WalletContextProvider>{children}</WalletContextProvider>
        </ThemeProvider>

        {/* PWA Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('SW registration note:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
