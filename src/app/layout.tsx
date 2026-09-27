import type { Metadata } from "next";
import { Navbar } from "@/ui/navbar/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Run Method",
  description: "Run coaching and training planning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
