import { FileText, LayoutDashboard, PenSquare } from "lucide-react";
import type { NavItem } from "@/components/DashboardShell";
import type { Profile } from "@/hooks/useAuth";
import { EMPTY_NEWS_FORM, type NewsFormValues } from "@/lib/news";

/** Representative-only navigation — no admin/management entries. */
export const REP_NAV: NavItem[] = [
  { label: "ড্যাশবোর্ড", to: "/representative", icon: LayoutDashboard, exact: true },
  { label: "নতুন সংবাদ", to: "/representative/news/new", icon: PenSquare },
  { label: "আমার সংবাদ", to: "/representative/news", icon: FileText, exact: true },
];

/** Pre-fills reporter identity and location from the signed-in representative profile. */
export function prefillFromProfile(profile: Profile | null): NewsFormValues {
  return {
    ...EMPTY_NEWS_FORM,
    reporter_name: profile?.full_name ?? "",
    reporter_designation: profile?.designation ?? "",
    district_id: profile?.district_id ?? "",
    upazila_id: profile?.upazila_id ?? "",
  };
}
