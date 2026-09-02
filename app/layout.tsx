import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import { SiteHeader } from "@/components/site-header";
import { isPortfolio } from "@/lib/site-mode";
import { SettingsProvider, settingsScript } from "@/lib/settings";
import { DialTurnsProvider } from "@/lib/dial-turns";
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
  description:
    "Damilare Osofisan — product designer and builder in Lagos. Interfaces, identity, and the systems underneath them, taken from nothing to shipped.",
};

export const viewport: Viewport = {
  themeColor: [
    /* --bg on each skin, or the browser chrome sits a shade off the page it
       is framing. Held to app/globals.css by hand: a retune that moves --bg
       moves these two. */
    { media: "(prefers-color-scheme: light)", color: "#f2f2f2" },
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
      <head>
        <script dangerouslySetInnerHTML={{ __html: settingsScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SettingsProvider>
            <DialTurnsProvider>
              {isPortfolio ? (
                children
              ) : (
                <>
                  <SiteHeader />
                  <div className="flex-1">{children}</div>
                </>
              )}
            </DialTurnsProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
