import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apparel Match - アパレルマッチングプラットフォーム",
  description: "アパレル人材の信用を可視化し、仕事の接点を生む",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
