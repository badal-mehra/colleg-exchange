import { Sidebar, SidebarInset } from "@/components/ui/sidebar";

export default function AppLayout({ children }) {
  return (
    <div className="flex">
      {/* Left Sidebar */}
      <Sidebar variant="sidebar" collapsible="offcanvas">
        {/* Your sidebar menu items will go here */}
      </Sidebar>

      {/* Main content */}
      <SidebarInset>
        {children}
      </SidebarInset>
    </div>
  );
}
