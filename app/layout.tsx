import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Lora } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TurnstileProvider } from "@/components/turnstile-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ascent | AI-Powered Career Toolkit",
  description:
    "Build ATS-friendly, professional resumes with AI-powered enhancement, grammar fixing, and job tailoring. Get AI-generated cover letters and interview prep guides. Powered by DeepSeek.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${lora.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TurnstileProvider>
            {children}
            <Toaster />
          </TurnstileProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
