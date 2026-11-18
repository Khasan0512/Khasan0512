import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "БлескАвто CRM — Детейлинг-студия",
  description: "CRM-система учёта заявок, автомобилей и загрузки боксов детейлинг-студии",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
