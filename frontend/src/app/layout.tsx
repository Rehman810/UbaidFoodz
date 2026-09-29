import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { DEFAULT_STORE_NAME, DEFAULT_STORE_TAGLINE } from "@/lib/branding";

export const metadata: Metadata = {
  title: `${DEFAULT_STORE_NAME} — ${DEFAULT_STORE_TAGLINE}`,
  description: "Order online for delivery or takeaway. Browse the menu, track orders, and pay cash on delivery.",
  keywords: ["restaurant", "food delivery", "online ordering", "takeaway", "menu"],
  openGraph: {
    title: DEFAULT_STORE_NAME,
    description: DEFAULT_STORE_TAGLINE,
    type: "website",
  },
  manifest: "/manifest.json",
  themeColor: "#c2410c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
