import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Plataforma de Subastas",
  description: "Subastas online en tiempo real",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        
        {/* Footer simple para enlaces legales y de contacto */}
        <footer className="border-t border-border/50 py-8 mt-auto glass">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} SUBASTAS.PRO. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6 text-sm font-medium">
              <Link href="/terminos" className="text-muted-foreground hover:text-foreground transition-colors">
                Términos y Condiciones
              </Link>
              <Link href="/contacto" className="text-muted-foreground hover:text-foreground transition-colors">
                Contacto / Soporte
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
