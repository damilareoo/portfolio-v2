import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const suisse = localFont({
  src: [
    { path: "./fonts/SuisseIntl-Light.woff2", weight: "300" },
    { path: "./fonts/SuisseIntl-Regular.woff2", weight: "400" },
    { path: "./fonts/SuisseIntl-Book.woff2", weight: "450" },
    { path: "./fonts/SuisseIntl-Medium.woff2", weight: "500" },
    { path: "./fonts/SuisseIntl-Bold.woff2", weight: "700" },
  ],
  variable: "--font-suisse",
  display: "swap",
});

const suisseMono = localFont({
  src: "./fonts/SuisseIntlMono-Regular.woff2",
  weight: "400",
  variable: "--font-suisse-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Damilare Osofisan",
  description: "Product designer. Selected work, experiments, and process.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${suisse.variable} ${suisseMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
