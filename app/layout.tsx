import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bis Gráfica - CRM",
  description: "Sistema de gestão da Bis Gráfica",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
