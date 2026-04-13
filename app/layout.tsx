import type { Metadata } from "next";
import { Manrope, Yeseva_One, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const yeseva = Yeseva_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-yeseva",
});

export const metadata: Metadata = {
  title: "Pronnect | Conectamos talento e necessidade",
  description:
    "Plataforma para conectar freelancers e profissionais de TI a empresas e clientes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={cn("scroll-smooth", "font-sans", geist.variable)}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${manrope.variable} ${yeseva.variable} bg-background font-body text-on-background antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
