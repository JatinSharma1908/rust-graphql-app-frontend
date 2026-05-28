import type { Metadata } from "next";
import "./globals.css";
import { ApolloWrapper } from "@/components/ApolloWrapper";

export const metadata: Metadata = {
    title: "Brewlink",
    description: "Your professional social network",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="h-full">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="min-h-full">
                <ApolloWrapper>{children}</ApolloWrapper>
            </body>
        </html>
    );
}