export type NavigationRole =
  | "Super Admin"
  | "Organization Admin"
  | "Plant Admin"
  | "Maintenance Manager"
  | "Engineer"
  | "Quality Engineer"
  | "Admin"
  | "Plant Manager"
  | "Maintenance Engineer"
  | "Operator"
  | "Viewer";

export type NavigationIcon =
  | "activity"
  | "barChart"
  | "bell"
  | "brain"
  | "building"
  | "clipboard"
  | "cpu"
  | "fileText"
  | "factory"
  | "gauge"
  | "layout"
  | "radio"
  | "shield"
  | "server"
  | "settings"
  | "users";

export interface NavigationItem {
  name: string;
  icon: NavigationIcon;
  href: string;
  roles: NavigationRole[];
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    name: "Dashboard",
    icon: "layout",
    href: "/",
    roles: [
      "Super Admin",
      "Admin",
      "Plant Admin",
      "Plant Manager",
      "Maintenance Manager",
      "Engineer",
      "Quality Engineer",
      "Maintenance Engineer",
      "Operator",
      "Viewer",
    ],
  },
  {
    name: "Executive",
    icon: "gauge",
    href: "/dashboard/executive",
    roles: ["Super Admin", "Admin", "Plant Admin", "Plant Manager"],
  },
  {
    name: "Enterprise Ops",
    icon: "building",
    href: "/enterprise",
    roles: [
      "Super Admin",
      "Admin",
      "Organization Admin",
      "Plant Admin",
      "Plant Manager",
      "Maintenance Manager",
      "Engineer",
      "Quality Engineer",
      "Maintenance Engineer",
      "Operator",
      "Viewer",
    ],
  },
  {
    name: "Machines",
    icon: "cpu",
    href: "/machines",
    roles: [
      "Super Admin",
      "Admin",
      "Plant Admin",
      "Plant Manager",
      "Maintenance Manager",
      "Engineer",
      "Quality Engineer",
      "Maintenance Engineer",
      "Operator",
      "Viewer",
    ],
  },
  {
    name: "Digital Twin",
    icon: "factory",
    href: "/plant",
    roles: [
      "Super Admin",
      "Admin",
      "Plant Admin",
      "Plant Manager",
      "Maintenance Manager",
      "Engineer",
      "Quality Engineer",
      "Maintenance Engineer",
      "Operator",
      "Viewer",
    ],
  },
  {
    name: "IoT Devices",
    icon: "radio",
    href: "/iot",
    roles: [
      "Super Admin",
      "Admin",
      "Plant Admin",
      "Plant Manager",
      "Maintenance Manager",
      "Engineer",
      "Quality Engineer",
      "Maintenance Engineer",
      "Operator",
      "Viewer",
    ],
  },
  {
    name: "Smart Factory",
    icon: "factory",
    href: "/smart-factory",
    roles: [
      "Super Admin",
      "Admin",
      "Organization Admin",
      "Plant Admin",
      "Plant Manager",
      "Maintenance Manager",
      "Engineer",
      "Quality Engineer",
      "Maintenance Engineer",
      "Operator",
      "Viewer",
    ],
  },
  {
    name: "Admin Portal",
    icon: "building",
    href: "/admin",
    roles: ["Super Admin", "Admin", "Plant Admin", "Plant Manager"],
  },
  {
    name: "Reports",
    icon: "fileText",
    href: "/reports",
    roles: [
      "Super Admin",
      "Admin",
      "Plant Admin",
      "Plant Manager",
      "Maintenance Manager",
      "Engineer",
      "Quality Engineer",
      "Maintenance Engineer",
      "Operator",
      "Viewer",
    ],
  },
  {
    name: "Audit",
    icon: "shield",
    href: "/audit",
    roles: [
      "Super Admin",
      "Admin",
      "Plant Admin",
      "Plant Manager",
      "Maintenance Manager",
    ],
  },
  {
    name: "System",
    icon: "server",
    href: "/system",
    roles: ["Super Admin", "Admin", "Plant Admin", "Plant Manager"],
  },
  {
    name: "Analytics",
    icon: "barChart",
    href: "/analytics",
    roles: [
      "Super Admin",
      "Admin",
      "Plant Admin",
      "Plant Manager",
      "Maintenance Manager",
      "Engineer",
      "Quality Engineer",
      "Maintenance Engineer",
      "Operator",
    ],
  },
  {
    name: "Copilot",
    icon: "brain",
    href: "/copilot",
    roles: [
      "Super Admin",
      "Admin",
      "Plant Admin",
      "Plant Manager",
      "Maintenance Manager",
      "Engineer",
      "Quality Engineer",
      "Maintenance Engineer",
      "Operator",
    ],
  },
  {
    name: "Predictive",
    icon: "activity",
    href: "/predictive",
    roles: [
      "Super Admin",
      "Admin",
      "Plant Admin",
      "Plant Manager",
      "Maintenance Manager",
      "Engineer",
      "Quality Engineer",
      "Maintenance Engineer",
      "Operator",
    ],
  },
  {
    name: "AI Intelligence",
    icon: "brain",
    href: "/ai",
    roles: [
      "Super Admin",
      "Admin",
      "Plant Admin",
      "Plant Manager",
      "Maintenance Manager",
      "Engineer",
      "Quality Engineer",
      "Maintenance Engineer",
      "Operator",
    ],
  },
  {
    name: "Work Orders",
    icon: "clipboard",
    href: "/workorders",
    roles: [
      "Super Admin",
      "Admin",
      "Plant Admin",
      "Plant Manager",
      "Maintenance Manager",
      "Engineer",
      "Quality Engineer",
      "Maintenance Engineer",
      "Operator",
      "Viewer",
    ],
  },
  {
    name: "Alerts",
    icon: "bell",
    href: "/alerts",
    roles: [
      "Super Admin",
      "Admin",
      "Plant Admin",
      "Plant Manager",
      "Maintenance Manager",
      "Engineer",
      "Quality Engineer",
      "Maintenance Engineer",
      "Operator",
      "Viewer",
    ],
  },
  {
    name: "Users",
    icon: "users",
    href: "/users",
    roles: ["Super Admin", "Admin", "Plant Admin", "Plant Manager"],
  },
  {
    name: "Settings",
    icon: "settings",
    href: "/settings",
    roles: [
      "Super Admin",
      "Admin",
      "Plant Admin",
      "Plant Manager",
      "Maintenance Manager",
      "Engineer",
      "Maintenance Engineer",
      "Operator",
      "Viewer",
    ],
  },
] as const;
