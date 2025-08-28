import MaintenanceWrapper from "@/components/maintenance-wrapper";
import Providers from "@/components/providers";
import SenfengLogoLoader from "@/components/senfengLogoLoader";
import { Toaster } from "@/components/ui/toaster";
import HolyLoader from "holy-loader";
import { Lato, Inter, Nunito, Yantramanav, Open_Sans, Poppins,  } from "next/font/google";
import { Suspense } from "react";

import "./globals.css";

export const metadata = {
  title: "SENFENG",
  description: "SENFENG APP",
  manifest: "/manifest.json",
};

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // optional CSS variable
});

const yantra = Yantramanav({
  subsets : ['latin'],
  weight : "500"
})

const open_sans = Open_Sans({
  subsets: ["latin"],
});

const poppins = Poppins({
  subsets: ["latin"],
  weight : "400"
});


export default async function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={` ${poppins.className} antialiased`}
        suppressHydrationWarning
      >
        {/* <NextTopLoader showSpinner={false} /> */}

        <HolyLoader />
        <Suspense fallback={<SenfengLogoLoader />}>
          <Providers>
            {/* <MobileScreenWrapper> */}
            <MaintenanceWrapper>{children}</MaintenanceWrapper>
            {/* </MobileScreenWrapper> */}
            {/* <PwaInstallButton /> */}
          </Providers>
        </Suspense>

        <Toaster />
      </body>
    </html>
  );
}
