import "@/styles/globals.css";
import Header from "@/app/_components/home/Header";
export default function InboxLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
