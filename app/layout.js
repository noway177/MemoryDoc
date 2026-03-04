import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "MemoryDoc | Minimalist Document Manager",
    description: "A single-page application for managing and retrieving documents with tags, ratings, and PDF storage.",
};

import { Toaster } from "sonner";

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={inter.className}>
                {children}
                <Toaster theme="dark" position="bottom-right" toastOptions={{ className: 'glass border-white/10 text-white shadow-xl' }} />
            </body>
        </html>
    );
}
