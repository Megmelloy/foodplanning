import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foodplanning | Find somewhere to eat together",
  description: "Gather friends' dining preferences, find common ground, and explore places to eat together.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
