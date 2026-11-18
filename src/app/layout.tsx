import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Table Sync | Dinner, decided together",
  description:
    "Join your group on one device, swipe cuisines Love, Open, or Skip, and choose from a personalized shortlist.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
