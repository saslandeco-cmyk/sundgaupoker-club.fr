import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Le Registre — Tournois de poker",
  description:
    "Créez et gérez vos tournois de poker : inscriptions, places disponibles et affichage en cartes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
