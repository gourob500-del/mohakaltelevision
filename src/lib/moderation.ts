import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/queries";

export type CommentRow = {
  id: string;
  news_id: string;
  user_id: string | null;
  author_name: string;
  body: string;
  is_approved: boolean;
  created_at: string;
};

export type ReportRow = {
  id: string;
  news_id: string;
  user_id: string | null;
  reason: string;
  details: string | null;
  contact: string | null;
  is_resolved: boolean;
  created_at: string;
};

export const REPORT_REASONS = [
  "ভুল তথ্য",
  "আপত্তিকর ভাষা",
  "কপিরাইট লঙ্ঘন",
  "বানান/তথ্য সংশোধন",
  "অন্যান্য",
];

/* ---------------- public ---------------- */

export async function fetchApprovedComments(newsId: string) {
  const { data, error } = await supabase
    .from("news_comments")
    .select("id, news_id, user_id, author_name, body, is_approved, created_at")
    .eq("news_id", newsId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as CommentRow[];
}

export async function submitComment(input: {
  news_id: string;
  author_name: string;
  body: string;
  user_id?: string | null;
}) {
  const name = input.author_name.trim();
  const body = input.body.trim();
  if (name.length < 2) throw new Error("নাম কমপক্ষে ২ অক্ষরের হতে হবে।");
  if (body.length < 3) throw new Error("মন্তব্য লিখুন।");
  if (body.length > 1000) throw new Error("মন্তব্য ১০০০ অক্ষরের বেশি হতে পারবে না।");
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from("news_comments").insert({
    news_id: input.news_id,
    author_name: name,
    body,
    user_id: auth.user?.id ?? null,
    is_approved: false,
  } as never);
  if (error) throw error;
}

export async function submitReport(input: {
  news_id: string;
  reason: string;
  details?: string;
  contact?: string;
  user_id?: string | null;
}) {
  if (!input.reason) throw new Error("কারণ নির্বাচন করুন।");
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from("news_reports").insert({
    news_id: input.news_id,
    reason: input.reason,
    details: input.details?.trim() || null,
    contact: input.contact?.trim() || null,
    user_id: auth.user?.id ?? null,
  } as never);
  if (error) throw error;
}

/* ---------------- admin ---------------- */

type WithNews<T> = T & { news: { title: string; slug: string } | null };

export async function fetchAllComments() {
  const { data, error } = await supabase
    .from("news_comments")
    .select("*, news:news(title, slug)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as unknown as WithNews<CommentRow>[];
}

export async function fetchAllReports() {
  const { data, error } = await supabase
    .from("news_reports")
    .select("*, news:news(title, slug)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as unknown as WithNews<ReportRow>[];
}

export async function setCommentApproval(id: string, approved: boolean) {
  const { error } = await supabase
    .from("news_comments")
    .update({ is_approved: approved } as never)
    .eq("id", id);
  if (error) throw error;
  await logActivity(approved ? "COMMENT_APPROVE" : "COMMENT_HIDE", "COMMENT", id);
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from("news_comments").delete().eq("id", id);
  if (error) throw error;
  await logActivity("COMMENT_DELETE", "COMMENT", id);
}

export async function setReportResolved(id: string, resolved: boolean) {
  const { error } = await supabase
    .from("news_reports")
    .update({ is_resolved: resolved } as never)
    .eq("id", id);
  if (error) throw error;
  await logActivity(resolved ? "REPORT_RESOLVE" : "REPORT_REOPEN", "REPORT", id);
}

export async function deleteReport(id: string) {
  const { error } = await supabase.from("news_reports").delete().eq("id", id);
  if (error) throw error;
  await logActivity("REPORT_DELETE", "REPORT", id);
}
