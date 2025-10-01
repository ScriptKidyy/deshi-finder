import { Scan, Search, Database, Settings as SettingsIcon, Heart } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Scanner", url: "/", icon: Scan },
  { title: "Search", url: "/search", icon: Search },
  { title: "Manage Products", url: "/manage", icon: Database },
  { title: "Settings", url: "/settings", icon: SettingsIcon },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent>
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-impact flex items-center justify-center">
              <span className="text-xl font-bold text-white">V</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">VocalKart</h1>
              <p className="text-xs text-primary">Scanner</p>
              <p className="text-xs text-muted-foreground">India First 🇮🇳</p>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground px-3 py-2">
            NAVIGATION
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="px-3 mt-6">
          <div className="bg-gradient-impact rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="h-4 w-4" />
              <span className="text-sm font-semibold">Your Impact</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="opacity-90">Products Scanned</span>
                <span className="font-bold">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-90">Indian Alternatives</span>
                <span className="font-bold">0</span>
              </div>
            </div>
          </div>
        </div>
      </SidebarContent>

      <div className="p-4 border-t border-sidebar-border mt-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-semibold text-sm">
            IN
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">VocalKart User</p>
            <p className="text-xs text-muted-foreground">Choose India First</p>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
