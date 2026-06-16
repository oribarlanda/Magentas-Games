import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/ui/Header";
import ScoreBar from "@/components/ui/ScoreBar";

export const metadata: Metadata = {
  title: "יום בריכה בחצב - אביב הוואי ובידור",
  description: "יום בריכה בחצב - אביב הוואי ובידור | Magenta Medical",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0F1117" />
      </head>
      <body className="bg-brand-bg text-brand-text min-h-screen antialiased">
        <Header />
        <ScoreBar />
        <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
