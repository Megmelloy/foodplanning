import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Table Sync | Dinner, decided together",
  description:
    "Gather your group's cravings and dealbreakers, get a shortlist, and vote on where to eat.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
