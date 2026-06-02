import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";


const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ChainVote — Voting Transparan di Blockchain",
  description:
    "Platform voting berbasis smart contract lokal. Setiap suara tercatat di blockchain — transparan, aman, dan tidak dapat dimanipulasi.",
  keywords: ["blockchain", "voting", "ethereum", "hardhat", "web3", "transparent"],
  openGraph: {
    title: "ChainVote — Voting Transparan di Blockchain",
    description:
      "Platform voting berbasis smart contract lokal yang transparan dan tidak dapat dimanipulasi.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${syne.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head>
        {/* No-flash theme script: runs before paint to avoid wrong-theme flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('chainvote-theme');if(t==='light'){document.documentElement.classList.add('light');}else if(t==='dark'){document.documentElement.classList.remove('light');}else if(window.matchMedia('(prefers-color-scheme:light)').matches){document.documentElement.classList.add('light');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-bg-base text-text-primary antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            },
          }}
        />
      </body>
    </html>
  );
}
