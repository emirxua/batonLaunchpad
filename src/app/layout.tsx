import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "BatonOutbid.icu — Solana Mascot & Burn Engine",
  description:
    "Showcase directory & on-chain burn engine for Solana memecoins and mascots. Burn $BATON to outbid ranks and claim #1.",
  openGraph: {
    title: "BatonOutbid.icu — Solana Mascot & Burn Engine",
    description:
      "Showcase directory & on-chain burn engine for Solana memecoins and mascots. Burn $BATON to outbid ranks and claim #1.",
    url: "https://batonoutbid.icu",
    siteName: "BatonOutbid.icu",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BatonOutbid.icu — Solana Mascot & Burn Engine",
    description:
      "Showcase directory & on-chain burn engine for Solana memecoins and mascots. Burn $BATON to outbid ranks and claim #1.",
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
      <body className="bg-bg text-text antialiased min-h-screen selection:bg-acid selection:text-bg">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <WalletContextProvider>{children}</WalletContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
