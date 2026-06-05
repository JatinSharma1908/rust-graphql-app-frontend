import type { Metadata } from "next";
import "./globals.css";
import { ApolloWrapper } from "@/components/ApolloWrapper";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Brewlink — Social Platform for Engineers",
  description: "Connect, share, and find jobs in tech",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <ApolloWrapper>
            {children}
          </ApolloWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}