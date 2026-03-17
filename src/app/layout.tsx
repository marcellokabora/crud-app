import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRUD App - Next.js",
  description: "A simple CRUD application built with Next.js and Server Actions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="border-b">
          <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              CRUD App
            </Link>
            <div className="flex gap-6 items-center">
              <Link href="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              <Link href="/posts" className="hover:text-primary transition-colors">
                Posts
              </Link>
              <Link href="/fetch-test" className="hover:text-primary transition-colors">
                Fetch Test
              </Link>
              <Link href="/i18n-demo" className="hover:text-primary transition-colors">
                i18n Demo
              </Link>
              <ThemeToggle />
            </div>
          </nav>
        </header>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="border-t mt-auto">
          <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
            Built with Next.js, Server Actions & shadcn/ui
          </div>
        </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
