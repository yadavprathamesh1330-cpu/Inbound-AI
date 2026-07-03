export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const primaryNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "AI Agents", href: "/agents", icon: "smart_toy" },
  { label: "Calls", href: "/calls", icon: "call" },
  { label: "Loads", href: "/loads", icon: "local_shipping" },
  { label: "Phone Numbers", href: "/phone-numbers", icon: "smartphone" },
  { label: "Leads", href: "/leads", icon: "group" },
  { label: "Knowledge Base", href: "/knowledge-base", icon: "database" },
  { label: "Workflows", href: "/workflows", icon: "account_tree" },
  { label: "Integrations", href: "/integrations", icon: "webhook" },
  { label: "Analytics", href: "/analytics", icon: "bar_chart" },
  { label: "Team", href: "/team", icon: "groups" },
  { label: "Billing", href: "/billing", icon: "payments" },
  { label: "Settings", href: "/settings", icon: "settings" },
];
