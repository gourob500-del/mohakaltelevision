import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { fetchApprovedComments, REPORT_REASONS, submitComment, submitReport } from "@/lib/moderation";
import { formatBnDate } from "@/lib/mtv";

export function NewsEngagement({
  newsId,
  commentSignal = 0,
  reportSignal = 0,
}: {
  newsId: string;
  commentSignal?: number;
  reportSignal?: number;
}) {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const commentRef = useRef<HTMLElement>(null);
  const [commentOpen, setCommentOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  useEffect(() => {
    if (commentSignal) setCommentOpen(true);
  }, [commentSignal]);
  useEffect(() => {
    if (reportSignal) setReportOpen(true);
  }, [reportSignal]);
  const [name, setName] = useState(profile?.full_name ?? "");
  const [body, setBody] = useState("");
  const [reason, setReason] = useState(REPORT_REASONS[0] ?? "");
  const [details, setDetails] = useState("");
  const [contact, setContact] = useState("");

  const { data: comments = [] } = useQuery({
    queryKey: ["approved-comments", newsId],
    queryFn: () => fetchApprovedComments(newsId),
  });

  const comment = useMutation({
    mutationFn: () => submitComment({ news_id: newsId, author_name: name, body, user_id: user?.id ?? null }),
    onSuccess: () => {
      setBody("");
      setCommentOpen(false);
      toast.success("মন্তব্য জমা হয়েছে। অনুমোদনের পর প্রকাশিত হবে।");
      void qc.invalidateQueries({ queryKey: ["approved-comments", newsId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "মন্তব্য জমা হয়নি"),
  });
  const report = useMutation({
    mutationFn: () => submitReport({ news_id: newsId, reason, details, contact, user_id: user?.id ?? null }),
    onSuccess: () => {
      setDetails("");
      setContact("");
      setReportOpen(false);
      toast.success("রিপোর্টটি জমা হয়েছে");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "রিপোর্ট জমা হয়নি"),
  });

  return (
    <>
      <section ref={commentRef} className="no-print mt-8 border-t border-border pt-6" id="comments">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">মন্তব্য ({comments.length})</h2>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { setName(profile?.full_name ?? name); setCommentOpen(true); }}>মন্তব্য করুন</Button>
            <Button size="sm" variant="outline" onClick={() => setReportOpen(true)}>রিপোর্ট করুন</Button>
          </div>
        </div>
        {comments.length ? (
          <ul className="mt-4 divide-y divide-border">
            {comments.map((item) => (
              <li key={item.id} className="py-3">
                <div className="flex flex-wrap items-center gap-x-2 text-sm">
                  <strong>{item.author_name}</strong>
                  <span className="text-xs text-muted-foreground">{formatBnDate(item.created_at)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-7">{item.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded border border-dashed border-border p-5 text-center text-sm text-muted-foreground">এখনো কোনো অনুমোদিত মন্তব্য নেই।</p>
        )}
      </section>

      <Dialog open={commentOpen} onOpenChange={setCommentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>মন্তব্য করুন</DialogTitle><DialogDescription>মন্তব্য অনুমোদনের পর সবার কাছে দেখা যাবে।</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label htmlFor="comment-name">নাম</Label><Input id="comment-name" value={name} disabled={!!profile?.full_name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label htmlFor="comment-body">মন্তব্য</Label><Textarea id="comment-body" rows={5} maxLength={1000} value={body} onChange={(e) => setBody(e.target.value)} /></div>
          </div>
          <DialogFooter><Button disabled={comment.isPending} onClick={() => comment.mutate()}>{comment.isPending ? "জমা হচ্ছে..." : "জমা দিন"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>সংবাদ রিপোর্ট করুন</DialogTitle><DialogDescription>সমস্যার কারণ ও প্রয়োজনীয় তথ্য দিন।</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label htmlFor="report-reason">কারণ</Label><select id="report-reason" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={reason} onChange={(e) => setReason(e.target.value)}>{REPORT_REASONS.map((item) => <option key={item}>{item}</option>)}</select></div>
            <div><Label htmlFor="report-details">বিস্তারিত</Label><Textarea id="report-details" rows={4} maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} /></div>
            <div><Label htmlFor="report-contact">যোগাযোগ (ঐচ্ছিক)</Label><Input id="report-contact" maxLength={200} value={contact} onChange={(e) => setContact(e.target.value)} /></div>
          </div>
          <DialogFooter><Button disabled={report.isPending} onClick={() => report.mutate()}>{report.isPending ? "জমা হচ্ছে..." : "রিপোর্ট জমা দিন"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <span className="hidden" data-comment-trigger onClick={() => { commentRef.current?.scrollIntoView({ behavior: "smooth" }); setCommentOpen(true); }} />
      <span className="hidden" data-report-trigger onClick={() => setReportOpen(true)} />
    </>
  );
}