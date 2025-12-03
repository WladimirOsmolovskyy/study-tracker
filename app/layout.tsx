import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "University Study Tracker",
  description: "Track your courses, events, and progress with style.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          "antialiased min-h-screen font-sans"
        )}
      >
        <div className="bg-noise" />
        <main className="relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
