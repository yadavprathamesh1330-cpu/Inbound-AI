"use client";

import { useRouter } from "next/navigation";
import { MagneticButton } from "@/components/ui-custom/magnetic-button";
import { Icon } from "@/components/ui-custom/icon";

export function CreateAgentButton() {
  const router = useRouter();

  return (
    <MagneticButton onClick={() => router.push("/agents/new")}>
      <Icon name="add" className="size-4" />
      Create Agent
    </MagneticButton>
  );
}
