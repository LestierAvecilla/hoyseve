import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { SidebarProvider } from "@/components/layout/sidebar-provider";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div
          className="flex-1 flex flex-col transition-[margin-left] duration-300 ease-out"
          style={{ marginLeft: "var(--sidebar-width)" }}
        >
          <Navbar />
          <main className="flex-1 pt-14">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
