import type { Metadata } from "next";
import { Hammersmith_One, Gabarito } from 'next/font/google';
import "./globals.css";

export const hammersmith = Hammersmith_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-hammersmith',
});

export const gabarito = Gabarito({
  subsets: ['latin'],
  variable: '--font-gabarito',
});

export const metadata: Metadata = {
  title: "Tiggets",
  description: "Handle your tickets with Tiggets!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  {/* loaded the fonts here */}
  return (
    <html
      lang="en"
      className={`${hammersmith.variable} ${gabarito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
