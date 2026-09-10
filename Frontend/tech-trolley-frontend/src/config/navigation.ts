import {
  BarChart3,
  Boxes,
  Building2,
  ContactRound,
  CreditCard,
  Gauge,
  Package,
  ReceiptText,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Tags,
  Truck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}
const all: UserRole[] = ["OWNER", "MANAGER", "SALESPERSON"];
const leaders: UserRole[] = ["OWNER", "MANAGER"];

export const navigation: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge, roles: all },
  { href: "/sales", label: "Sales", icon: ShoppingCart, roles: all },
  { href: "/purchases", label: "Purchases", icon: ShoppingBag, roles: leaders },
  { href: "/inventory", label: "Inventory", icon: Boxes, roles: all },
  { href: "/products", label: "Products", icon: Package, roles: all },
  { href: "/brands", label: "Brands", icon: Tags, roles: all },
  { href: "/categories", label: "Categories", icon: Building2, roles: all },
  { href: "/customers", label: "Customers", icon: ContactRound, roles: all },
  { href: "/suppliers", label: "Suppliers", icon: Truck, roles: all },
  { href: "/accounts", label: "Accounts", icon: CreditCard, roles: leaders },
  { href: "/expenses", label: "Expenses", icon: ReceiptText, roles: leaders },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: leaders },
  { href: "/team", label: "Team", icon: UsersRound, roles: leaders },
  { href: "/settings", label: "Shop settings", icon: Settings, roles: leaders },
];

export function roleCanAccess(role: UserRole, href: string) {
  const item = navigation.find(
    (entry) => href === entry.href || href.startsWith(`${entry.href}/`),
  );
  return !item || item.roles.includes(role);
}
