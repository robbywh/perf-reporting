import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Header from "./components/header";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <Header />
          <div className="p-10">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}

