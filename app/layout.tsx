import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { FocusMiniplayer } from "@/components/focus/FocusMiniplayer";

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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 relative overflow-x-hidden">
              {children}
              <FocusMiniplayer />
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
