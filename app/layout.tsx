import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Filhos da Britânia — Criação de Personagem",
  description: "Crie seu personagem no mundo das Crônicas de Arthur, inspirado em Bernard Cornwell.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="noise-overlay min-h-screen bg-ink">
        {children}
      </body>
    </html>
  );
}
