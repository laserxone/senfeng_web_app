import Providers from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import HolyLoader from "holy-loader";
import { Loader2 } from "lucide-react";
import { Lato } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

export const metadata = {
  title: "SENFENG",
  description: "SENFENG APP",
};

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

export default async function RootLayout({ children }) {
  return (
    <html lang="en" className={`${lato.className}`} suppressHydrationWarning>
      <body className={"overflow-hidden"}>
        {/* <NextTopLoader showSpinner={false} /> */}
        <HolyLoader />
        <Suspense
          fallback={
            <div className="flex flex-1 justify-center items-center min-h-screen">
              <Loader2 className="animate-spin" />
            </div>
          }
        >
          <Providers>
            {/* <MobileScreenWrapper> */}
              {children}
              {/* </MobileScreenWrapper> */}
          </Providers>
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}
