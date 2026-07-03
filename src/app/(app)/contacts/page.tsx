import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui-custom/page-header";
import { PageTransition } from "@/components/ui-custom/page-transition";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContactsClient, type ContactRow } from "./contacts-client";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const contacts = await prisma.contact.findMany({
    where: { organizationId: user.orgId },
    orderBy: { name: "asc" },
  });

  const rows: ContactRow[] = contacts.map((c) => ({
    id: c.id,
    type: c.type,
    name: c.name,
    company: c.company,
    phone: c.phone,
    email: c.email,
    mcNumber: c.mcNumber,
    dotNumber: c.dotNumber,
    city: c.city,
    state: c.state,
    notes: c.notes,
  }));

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="Your dispatch address book — brokers, carriers, drivers, and shippers you work with."
      />
      <PageTransition>
        <ContactsClient initialContacts={rows} />
      </PageTransition>
    </div>
  );
}
