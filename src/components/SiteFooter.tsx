import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter, Youtube } from "lucide-react";
import { fetchSettings } from "@/lib/queries";
import { toBn } from "@/lib/mtv";

type S = Record<string, unknown>;
const str = (s: S | undefined, key: string) => {
  const v = s?.[key];
  return typeof v === "string" && v.trim() ? v.trim() : "";
};

export function SiteFooter() {
  const { data } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const s = data as S | undefined;
  const year = new Date().getFullYear();

  const socials = [
    { url: str(s, "facebook_url"), Icon: Facebook, label: "Facebook" },
    { url: str(s, "youtube_url"), Icon: Youtube, label: "YouTube" },
    { url: str(s, "twitter_url"), Icon: Twitter, label: "Twitter" },
    { url: str(s, "instagram_url"), Icon: Instagram, label: "Instagram" },
  ].filter((x) => !!x.url);

  const team = [
    { label: "সম্পাদক", value: str(s, "editor_name") },
    { label: "বার্তা সম্পাদক", value: str(s, "news_editor_name") },
    { label: "নির্বাহী সম্পাদক", value: str(s, "executive_editor_name") },
    { label: "প্রকাশক", value: str(s, "publisher_name") },
  ];
  const hasTeam = team.some((t) => t.value);
  const address = str(s, "office_address");
  const phone = str(s, "contact_number");
  const email = str(s, "contact_email");

  return (
    <footer className="mt-10 bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-black">{str(s, "site_name") || "MOHAKAL TELEVISION"}</p>
          <p className="mt-1 text-sm text-ink-foreground/70">
            {str(s, "tagline") || "আপনার আয়োজন, আমাদের সংবাদ"}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink-foreground/80">
            {str(s, "about_text")}
          </p>
          {socials.length ? (
            <div className="mt-5">
              <p className="mb-2 text-sm font-bold">সামাজিক যোগাযোগমাধ্যম</p>
              <div className="flex gap-2">
                {socials.map(({ url, Icon, label }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={label}
                    className="grid h-9 w-9 place-items-center rounded border border-white/20 transition-colors hover:bg-primary"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-xs text-ink-foreground/50">
              সোশ্যাল লিংক অ্যাডমিন সেটিংস থেকে যুক্ত করুন।
            </p>
          )}
        </div>

        <div>
          <p className="mb-3 border-b border-primary/60 pb-2 font-bold">সম্পাদকীয় পরিষদ</p>
          {hasTeam ? (
            <ul className="space-y-3 text-sm">
              {team
                .filter((t) => t.value)
                .map((t) => (
                  <li key={t.label}>
                    <span className="block text-xs uppercase tracking-wide text-ink-foreground/55">
                      {t.label}
                    </span>
                    <span className="font-semibold text-ink-foreground">{t.value}</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-xs text-ink-foreground/50">
              সম্পাদকীয় তথ্য অ্যাডমিন → ওয়েবসাইট সেটিংস থেকে যুক্ত করুন।
            </p>
          )}
        </div>

        <div>
          <p className="mb-3 border-b border-primary/60 pb-2 font-bold">যোগাযোগ</p>
          <ul className="space-y-3 text-sm text-ink-foreground/80">
            <li>
              <span className="block text-xs uppercase tracking-wide text-ink-foreground/55">
                অফিসের ঠিকানা
              </span>
              <span className="mt-1 inline-flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="leading-relaxed">
                  {address || "ঠিকানা সেটিংস থেকে যুক্ত করুন"}
                </span>
              </span>
            </li>
            <li>
              <span className="block text-xs uppercase tracking-wide text-ink-foreground/55">
                মোবাইল
              </span>
              <a
                href={`tel:${phone || "01966658179"}`}
                className="mt-1 inline-flex items-center gap-2 hover:text-primary"
              >
                <Phone className="h-4 w-4 text-primary" />
                {toBn(phone || "01966658179")}
              </a>
            </li>
            <li>
              <span className="block text-xs uppercase tracking-wide text-ink-foreground/55">
                ই-মেইল
              </span>
              {email ? (
                <a
                  href={`mailto:${email}`}
                  className="mt-1 inline-flex items-center gap-2 break-all hover:text-primary"
                >
                  <Mail className="h-4 w-4 text-primary" />
                  {email}
                </a>
              ) : (
                <span className="mt-1 inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  ই-মেইল সেটিংস থেকে যুক্ত করুন
                </span>
              )}
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-3 border-b border-primary/60 pb-2 font-bold">গুরুত্বপূর্ণ লিংক</p>
          <ul className="space-y-2 text-sm text-ink-foreground/80">
            <li>
              <Link to="/" className="hover:text-primary">
                প্রচ্ছদ
              </Link>
            </li>
            <li>
              <Link to="/latest" className="hover:text-primary">
                সর্বশেষ সংবাদ
              </Link>
            </li>
            <li>
              <Link to="/district" className="hover:text-primary">
                জেলার সংবাদ
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-primary">
                আমাদের সম্পর্কে
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-primary">
                যোগাযোগ
              </Link>
            </li>
            <li className="pt-2">
              <Link to="/representative/login" className="hover:text-primary">
                প্রতিনিধি লগইন
              </Link>
            </li>
            <li>
              <Link to="/admin/login" className="hover:text-primary">
                অ্যাডমিন লগইন
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-ink-foreground/60">
        © {toBn(year)} {str(s, "site_name") || "MOHAKAL TELEVISION"} — সর্বস্বত্ব সংরক্ষিত
      </div>
    </footer>
  );
}
