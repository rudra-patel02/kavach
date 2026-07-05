export type NavigationRole =
  | "Super Admin"
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
  | "clipboard"
  | "cpu"
  | "factory"
  | "gauge"
  | "layout"
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
      "Plant Manager",
      "Maintenance Engineer",
      "Operator",
      "Viewer",
    ],
  },
  {
    name: "Executive",
    icon: "gauge",
    href: "/dashboard/executive",
    roles: ["Super Admin", "Admin", "Plant Manager"],
  },
  {
    name: "Machines",
    icon: "cpu",
    href: "/machines",
    roles: [
      "Super Admin",
      "Admin",
      "Plant Manager",
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
      "Plant Manager",
      "Maintenance Engineer",
      "Operator",
      "Viewer",
    ],
  },
  {
    name: "Analytics",
    icon: "barChart",
    href: "/analytics",
    roles: [
      "Super Admin",
      "Admin",
      "Plant Manager",
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
      "Plant Manager",
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
      "Plant Manager",
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
      "Plant Manager",
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
      "Plant Manager",
      "Maintenance Engineer",
      "Operator",
      "Viewer",
    ],
  },
  {
    name: "Users",
    icon: "users",
    href: "/users",
    roles: ["Super Admin", "Admin", "Plant Manager"],
  },
  {
    name: "Settings",
    icon: "settings",
    href: "/settings",
    roles: [
      "Super Admin",
      "Admin",
      "Plant Manager",
      "Maintenance Engineer",
      "Operator",
      "Viewer",
    ],
  },
] as const;
