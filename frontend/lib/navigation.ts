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

const ALL_ROLES: NavigationRole[] = [
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
];

const ADMIN_ROLES: NavigationRole[] = [
  "Super Admin",
  "Admin",
  "Plant Admin",
  "Plant Manager",
];

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    name: "Dashboard",
    icon: "layout",
    href: "/",
    roles: ALL_ROLES,
  },
  {
    name: "Machines",
    icon: "cpu",
    href: "/machines",
    roles: ALL_ROLES,
  },
  {
    name: "Alerts",
    icon: "bell",
    href: "/alerts",
    roles: ALL_ROLES,
  },
  {
    name: "Work Orders",
    icon: "clipboard",
    href: "/workorders",
    roles: ALL_ROLES,
  },
  {
    name: "Reports",
    icon: "fileText",
    href: "/reports",
    roles: ALL_ROLES,
  },
  {
    name: "Admin Portal",
    icon: "building",
    href: "/admin",
    roles: ADMIN_ROLES,
  },
  {
    name: "Users",
    icon: "users",
    href: "/users",
    roles: ADMIN_ROLES,
  },
];
