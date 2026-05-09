import type { Metadata } from "next";
import { Instrument_Serif, Geist } from "next/font/google";
import "../styles/globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
  weight: ["400"],
  style: ["normal", "italic"],
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

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
    <html lang="en" className={`${instrumentSerif.variable} ${geist.variable}`}>
      <body className="font-sans antialiased" style={{ background: "#FBF7EE" }}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
