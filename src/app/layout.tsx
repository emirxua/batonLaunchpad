import type { Metadata, Viewport } from "next";
import { Archivo_Black, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "@/styles/wallet-adapter-custom.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { WalletContextProvider } from "@/components/WalletContextProvider";
import { LiveBurnToast } from "@/components/terminal/LiveBurnToast";
import { Ticker } from "@/components/Ticker";

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
  themeColor: "#0B0E14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://outbid.bond"),
  title: "outbid.bond",
  description: "Solana Alpha Terminal & Attention Auction Engine",
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://outbid.bond",
  },
  openGraph: {
    siteName: "outbid.bond",
    url: "https://outbid.bond",
    title: "outbid.bond",
    description: "Solana Alpha Terminal & Attention Auction Engine",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "outbid.bond",
    description: "Solana Alpha Terminal & Attention Auction Engine",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Outbid",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Outbid",
    "mobile-web-app-capable": "yes",
    "format-detection": "telephone=no",
  },
  icons: {
    icon: [
      { url: "/icon", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/images/baton-logo.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
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
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon" />
        <link rel="icon" href="/icon" sizes="any" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Outbid" />
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className="bg-[#0B0E14] text-zinc-100 antialiased min-h-screen overflow-x-hidden selection:bg-[#14F195] selection:text-black font-mono">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <WalletContextProvider>
            {children}
            <LiveBurnToast />
          </WalletContextProvider>
        </ThemeProvider>

        {/* Force unregister any legacy service workers & clear caches on localhost */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for (var i = 0; i < registrations.length; i++) {
                    registrations[i].unregister();
                  }
                });
                if ('caches' in window) {
                  caches.keys().then(function(keys) {
                    keys.forEach(function(k) { caches.delete(k); });
                  });
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
