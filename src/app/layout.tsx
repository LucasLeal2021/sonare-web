import type { Metadata } from "next";
import { Instrument_Serif, Inter, Jost } from "next/font/google";
import "./globals.css";

// Títulos: serifada elegante (o peso humano da escrita)
const instrumentSerif = Instrument_Serif({ variable: "--font-instrument-serif", subsets: ["latin"], weight: "400" });
// Interface: funcional e legível
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
// Logotipo: geométrica, fina, com espaçamento largo
const jost = Jost({ variable: "--font-jost", subsets: ["latin"], weight: ["300"] });

export const metadata: Metadata = {
  title: "sonare.",
  description: "Do silêncio nasce a criação: escreva um texto, escolha uma voz.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${instrumentSerif.variable} ${inter.variable} ${jost.variable} h-full antialiased`}>
      <body className="min-h-full bg-papel font-ui text-grafite">{children}</body>
    </html>
  );
}
