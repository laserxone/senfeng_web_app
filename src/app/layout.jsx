import Providers from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import HolyLoader from "holy-loader";
import { Loader2 } from "lucide-react";
import { Lato } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import SenfengLogoLoader from "@/components/senfengLogoLoader";

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
          <SenfengLogoLoader />
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
