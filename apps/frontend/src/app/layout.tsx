import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/providers";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "ClearPath - Student Clearance System",
    template: "%s | ClearPath",
  },
  description:
    "Digital Student Clearance and Exam Eligibility Verification System",
  keywords: [
    "clearance",
    "student",
    "exam",
    "eligibility",
    "university",
  ],
  authors: [{ name: "ClearPath" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
      className={`${inter.variable} font-sans dark`}
    >
      <head>
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>
          <div className="relative min-h-screen">
            {/* Background gradient decoration */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
              <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-primary opacity-10 blur-3xl" />
              <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-secondary opacity-10 blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-gradient-primary opacity-5 blur-3xl" />
            </div>
            {children}
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "var(--card-bg)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--card-border)",
                color: "var(--foreground)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
