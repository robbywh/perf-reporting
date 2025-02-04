import Header from "../../components/header";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Header />
      <div className="p-10">{children}</div>
    </div>
  );
}
