import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foodplanning | A little less dinner stress",
  description: "Plan your dinners and grocery list with an AI-powered food planner.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
