import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Planejamento Agrícola | Portal",
  description: "Planejamento de safra inteligente e otimizado.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={cn("min-h-screen bg-background font-sans antialiased selection:bg-primary/20 selection:text-primary")}>
        {children}
      </body>
    </html>
  );
}
