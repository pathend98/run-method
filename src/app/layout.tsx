import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Training Brain",
  description: "Run coaching and training planning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
