import type { Metadata } from "next";
import "../styles/globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "S&D Prophetic School | Sons and Daughters of Prophets",
  description:
    "A two-year prophetic training school raising New Testament prophets — rooted in the Word, led by the Spirit, and accountable to the Body of Christ. Celestial Church of Christ.",
  metadataBase: new URL("https://sandd.abiodunsule.uk"),
  openGraph: {
    title: "S&D Prophetic School",
    description: "Raising New Testament Prophets for This Age",
    url: "https://sandd.abiodunsule.uk",
    siteName: "S&D Prophetic School",
    locale: "en_NG",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
