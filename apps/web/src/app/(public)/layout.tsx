export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="font-[var(--font-campaign-body)]">{children}</div>;
}
