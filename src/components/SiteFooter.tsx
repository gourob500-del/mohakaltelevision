import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Facebook, Instagram, Phone, Twitter, Youtube } from "lucide-react";
import { fetchSettings } from "@/lib/queries";
import { toBn } from "@/lib/mtv";

export function SiteFooter() {
  const { data: s } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const year = new Date().getFullYear();

  const socials = [
    { url: s?.facebook_url, Icon: Facebook, label: "Facebook" },
    { url: s?.youtube_url, Icon: Youtube, label: "YouTube" },
    { url: s?.twitter_url, Icon: Twitter, label: "Twitter" },
    { url: s?.instagram_url, Icon: Instagram, label: "Instagram" },
  ].filter((x) => !!x.url);

  return (
    <footer className="mt-10 bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-black">{s?.site_name ?? "MOHAKAL TELEVISION"}</p>
          <p className="mt-1 text-sm text-ink-foreground/70">
            {s?.tagline ?? "আপনার আয়োজন, আমাদের সংবাদ"}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink-foreground/80">{s?.about_text}</p>
        </div>

        <div>
          <p className="mb-3 font-bold">গুরুত্বপূর্ণ লিংক</p>
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
          </ul>
        </div>

        <div>
          <p className="mb-3 font-bold">প্যানেল</p>
          <ul className="space-y-2 text-sm text-ink-foreground/80">
            <li>
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

        <div>
          <p className="mb-3 font-bold">যোগাযোগ</p>
          <p className="inline-flex items-center gap-2 text-sm text-ink-foreground/80">
            <Phone className="h-4 w-4" /> {toBn(s?.contact_number ?? "01966658179")}
          </p>
          {s?.contact_email ? (
            <p className="mt-1 text-sm text-ink-foreground/80">{s.contact_email}</p>
          ) : null}
          {socials.length ? (
            <div className="mt-4 flex gap-2">
              {socials.map(({ url, Icon, label }) => (
                <a
                  key={label}
                  href={url as string}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded border border-white/20 hover:bg-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-xs text-ink-foreground/50">
              সোশ্যাল লিংক অ্যাডমিন সেটিংস থেকে যুক্ত করুন।
            </p>
          )}
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-ink-foreground/60">
        © {toBn(year)} {s?.site_name ?? "MOHAKAL TELEVISION"} — সর্বস্বত্ব সংরক্ষিত
      </div>
    </footer>
  );
}
