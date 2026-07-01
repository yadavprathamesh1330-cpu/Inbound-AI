import { getIcon } from "@/lib/icon-map";
import type { LucideProps } from "lucide-react";

export function Icon({
  name,
  ...props
}: { name: string } & Omit<LucideProps, "ref">) {
  const Cmp = getIcon(name);
  return <Cmp {...props} />;
}
