import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Office Flight Table",
  description: "Real-time flight information for the office",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
