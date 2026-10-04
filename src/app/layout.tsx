import type { Metadata } from "next";
import { Navbar } from "@/ui/shell/navbar/navbar";
import { QueryProvider } from "./query-provider";
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
        <QueryProvider>
          <Navbar />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
