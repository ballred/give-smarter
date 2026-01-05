import { Fraunces, Manrope } from "next/font/google";

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-campaign-display",
  weight: ["600", "700", "800"],
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-campaign-body",
  weight: ["400", "500", "600", "700"],
});

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${displayFont.variable} ${bodyFont.variable} font-[var(--font-campaign-body)]`}
    >
      {children}
    </div>
  );
}
