import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, MapPin, Phone } from "lucide-react";
import { PublicLayout, SectionTitle } from "@/components/PublicLayout";
import { fetchSettings } from "@/lib/queries";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "যোগাযোগ — MOHAKAL TELEVISION" },
      {
        name: "description",
        content: "MOHAKAL TELEVISION-এর সম্পাদকীয় দপ্তরের ঠিকানা, ফোন ও ই-মেইল।",
      },
      { property: "og:title", content: "যোগাযোগ — MOHAKAL TELEVISION" },
      { property: "og:description", content: "MOHAKAL TELEVISION-এর সাথে যোগাযোগের তথ্য।" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data } = useQuery({ queryKey: ["settings"], queryFn: () => fetchSettings() });

  const items = [
    { icon: MapPin, label: "ঠিকানা", value: data?.address || "ঢাকা, বাংলাদেশ" },
    { icon: Phone, label: "ফোন", value: data?.contact_phone || "—" },
    { icon: Mail, label: "ই-মেইল", value: data?.contact_email || "—" },
  ];

  return (
    <PublicLayout>
      <SectionTitle>যোগাযোগ</SectionTitle>
      <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-card p-4 shadow-card">
            <item.icon className="h-5 w-5 text-primary" />
            <p className="mt-2 text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-sm font-semibold break-words">{item.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 max-w-3xl text-sm text-muted-foreground">
        সংবাদ পাঠাতে বা প্রতিনিধি হিসেবে যুক্ত হতে আমাদের ই-মেইলে যোগাযোগ করুন।
      </p>
    </PublicLayout>
  );
}
