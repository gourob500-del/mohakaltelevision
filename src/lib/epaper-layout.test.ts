import { describe, expect, it } from "vitest";
import {
  buildLayout,
  dhakaDayRange,
  dhakaDate,
  sourceDateFor,
  sentenceExcerpt,
  DEFAULT_TEMPLATE,
  type EpaperNewsInput,
  type EpaperAdInput,
} from "./epaper-layout";

const news = (i: number, cat = "national"): EpaperNewsInput => ({
  id: `n${i}`, slug: `s${i}`, title: `শিরোনাম ${i}`, summary: null,
  content: "প্রথম বাক্য। দ্বিতীয় বাক্য। ".repeat(30), featured_image: null, caption: null,
  reporter_name: "রিপোর্টার", reporter_designation: null, district: null,
  category_slug: cat, category_name: cat, is_top: false, is_breaking: false,
  published_at: `2026-10-07T0${i % 10}:00:00Z`,
});
const cats = { "2": ["national"], "3": ["district"], "4": ["sports"] };

describe("e-paper rules", () => {
  it("issue for 8 Oct uses news of 7 Oct Dhaka time", () => {
    expect(sourceDateFor("2026-10-08")).toBe("2026-10-07");
    expect(dhakaDayRange("2026-10-07")).toEqual({ start: "2026-10-06T18:00:00.000Z", end: "2026-10-07T18:00:00.000Z" });
  });
  it("Dhaka date flips at local midnight", () => {
    expect(dhakaDate(new Date("2026-10-07T18:05:00Z"))).toBe("2026-10-08");
    expect(dhakaDate(new Date("2026-10-07T17:55:00Z"))).toBe("2026-10-07");
  });
  it("never produces more than 4 pages", () => {
    const many = Array.from({ length: 200 }, (_, i) => news(i, ["national", "district", "sports", "x"][i % 4]));
    const r = buildLayout({ issueDate: "2026-10-08", news: many, ads: [], pageCategories: cats, template: DEFAULT_TEMPLATE });
    expect(r.pages.length).toBe(4);
    expect(r.leftOver).toBeGreaterThan(0);
  });
  it("does not include the same news twice", () => {
    const r = buildLayout({ issueDate: "2026-10-08", news: [news(1), news(1), news(2)], ads: [], pageCategories: cats, template: DEFAULT_TEMPLATE });
    const ids = r.pages.flatMap((p) => p.items.map((i) => i.newsId));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(2);
  });
  it("no news means no pages", () => {
    expect(buildLayout({ issueDate: "2026-10-08", news: [], ads: [], pageCategories: cats, template: DEFAULT_TEMPLATE }).pages).toHaveLength(0);
  });
  it("expired ads are not placed and a full-page ad keeps news off that page only", () => {
    const ad = (o: Partial<EpaperAdInput>): EpaperAdInput => ({ id: "a", title: "t", organization: null, image_url: "x", link_url: null, starts_on: null, ends_on: null, pages: [4], position: "bottom", size: "small", is_active: true, sort_order: 0, ...o });
    const base = { issueDate: "2026-10-08", news: [news(1), news(2, "sports")], pageCategories: cats, template: DEFAULT_TEMPLATE };
    expect(buildLayout({ ...base, ads: [ad({ ends_on: "2026-10-07" })] }).pages.flatMap((p) => p.ads)).toHaveLength(0);
    const full = buildLayout({ ...base, ads: [ad({ position: "full", pages: [2] })] });
    expect(full.pages.find((p) => p.ads.some((a) => a.position === "full"))?.items).toHaveLength(0);
    expect(full.included).toBe(2);
  });
  it("excerpts end at a sentence boundary", () => {
    const r = sentenceExcerpt("এক। দুই তিন। চার পাঁচ ছয়।", 10);
    expect(r.text).toBe("এক।");
    expect(r.truncated).toBe(true);
  });
});
