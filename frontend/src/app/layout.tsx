import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Ubaid Fast Foodz — Order in minutes",
  description: "Karachi heat. Street flavor. Delivered fast. Zinger, biryani, broast and more — cash on delivery across Karachi.",
  keywords: ["fast food", "Karachi", "delivery", "biryani", "zinger", "Ubaid Fast Foodz"],
  openGraph: {
    title: "Ubaid Fast Foodz",
    description: "Karachi heat. Street flavor. Delivered fast.",
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
