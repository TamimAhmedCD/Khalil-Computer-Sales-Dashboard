import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import QueryProvider from "@/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Khalil Computer | Shop Management Portal",
  description: "Secure management system for Khalil Computer Shop",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        geistSans.variable,
        geistMono.variable,
        "h-full antialiased",
      )}
    >
      <body
        className="h-full transition-colors duration-500 bg-white dark:bg-[#09090b]"
        cz-shortcut-listen="true"
      >
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {/* DYNAMIC TECHNICAL BACKGROUND 
               - Light Mode: Subtle gray dots on white
               - Dark Mode: Subtle zinc dots on deep black
            */}
            <div className="relative min-h-screen w-full">
              <div
                className="fixed inset-0 -z-10 h-full w-full 
                /* Light Mode Pattern */
                bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[32px_32px] 
                /* Dark Mode Pattern */
                dark:bg-[radial-gradient(#18181b_1px,transparent_1px)] 
                /* Fade effect towards edges */
                mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"
              />

              <div className="relative z-10">
                <QueryProvider>{children}</QueryProvider>
              </div>
              <Toaster />
            </div>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
