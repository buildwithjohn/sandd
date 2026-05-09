import type { Metadata } from "next";
import "../styles/globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";

export const metadata: Metadata = {
  title: "S&D Prophetic School | Sons and Daughters of Prophets",
  description: "A two-year prophetic training school raising New Testament prophets, rooted in the Word, led by the Spirit, and accountable to the Body of Christ. Treasures in Clay Ministries.",
  metadataBase: new URL("https://sandd.abiodunsule.uk"),
  icons: { icon: "/favicon.png", apple: "/favicon.png" },
  openGraph: {
    title: "S&D Prophetic School",
    description: "Raising New Testament Prophets for This Age",
    url: "https://sandd.abiodunsule.uk",
    siteName: "S&D Prophetic School",
    locale: "en_NG",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply theme before paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('sandd-theme');
              var d = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (t === 'dark' || (!t && d)) document.documentElement.classList.add('dark');
            } catch(e) {}
          })();
        `}} />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
