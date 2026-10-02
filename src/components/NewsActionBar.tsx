import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  Check,
  Clipboard,
  Facebook,
  FileDown,
  Flag,
  MessageCircle,
  Minus,
  Plus,
  Printer,
  Share2,
  SquareArrowOutUpRight,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = {
  newsId: string;
  slug: string;
  title: string;
  image: string | null;
  fontSize: number;
  onFontSize: (size: number) => void;
  onComment: () => void;
  onReport: () => void;
};

export function NewsActionBar({
  newsId,
  slug,
  title,
  image,
  fontSize,
  onFontSize,
  onComment,
  onReport,
}: Props) {
  const [bookmarked, setBookmarked] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const url = typeof window === "undefined" ? "" : window.location.href;
  const shareText = `${title}${image ? `\n${image}` : ""}\n${url}`;
  const key = `mtv-bookmark-${newsId}`;

  useEffect(() => {
    setBookmarked(window.localStorage.getItem(key) === "1");
    return () => window.speechSynthesis?.cancel();
  }, [key]);

  const actions = useMemo(
    () => [
      {
        label: "Facebook",
        icon: Facebook,
        run: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer"),
      },
      {
        label: "WhatsApp",
        icon: MessageCircle,
        run: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer"),
      },
      {
        label: "Messenger",
        icon: SquareArrowOutUpRight,
        run: () => window.open(`fb-messenger://share/?link=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer"),
      },
    ],
    [shareText, url],
  );

  const copy = async () => {
    await navigator.clipboard.writeText(`${title}\n${url}`);
    toast.success("লিংক কপি হয়েছে");
  };

  const toggleBookmark = () => {
    const next = !bookmarked;
    setBookmarked(next);
    window.localStorage.setItem(key, next ? "1" : "0");
    toast.success(next ? "সংবাদটি বুকমার্ক হয়েছে" : "বুকমার্ক সরানো হয়েছে");
  };

  const toggleSpeech = () => {
    if (!("speechSynthesis" in window)) {
      toast.error("এই ব্রাউজারে পড়ে শোনানো সমর্থিত নয়");
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const article = document.querySelector("[data-news-content]")?.textContent ?? title;
    const utterance = new SpeechSynthesisUtterance(`${title}। ${article}`);
    utterance.lang = "bn-BD";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const iconButton = "h-9 w-9 shrink-0";
  return (
    <div className="no-print my-5 border-y border-border bg-card py-2" aria-label="সংবাদ অ্যাকশন">
      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
        {actions.map(({ label, icon: Icon, run }) => (
          <Button key={label} variant="ghost" size="icon" className={iconButton} onClick={run} title={label} aria-label={label}>
            <Icon />
          </Button>
        ))}
        <Button variant="ghost" size="icon" className={iconButton} onClick={copy} title="লিংক কপি" aria-label="লিংক কপি">
          <Clipboard />
        </Button>
        <Button variant="ghost" size="icon" className={iconButton} onClick={() => window.print()} title="প্রিন্ট" aria-label="প্রিন্ট">
          <Printer />
        </Button>
        <Button variant="ghost" size="icon" className={iconButton} onClick={() => window.print()} title="PDF" aria-label="PDF">
          <FileDown />
        </Button>
        <Button variant="ghost" size="icon" className={iconButton} onClick={toggleBookmark} title="বুকমার্ক" aria-label="বুকমার্ক">
          {bookmarked ? <Check /> : <Bookmark />}
        </Button>
        <span className="mx-1 h-6 w-px shrink-0 bg-border" />
        <Button variant="ghost" size="icon" className={iconButton} disabled={fontSize <= 15} onClick={() => onFontSize(fontSize - 1)} title="ফন্ট ছোট" aria-label="ফন্ট ছোট">
          <Minus />
        </Button>
        <span className="min-w-8 text-center text-xs">অ</span>
        <Button variant="ghost" size="icon" className={iconButton} disabled={fontSize >= 24} onClick={() => onFontSize(fontSize + 1)} title="ফন্ট বড়" aria-label="ফন্ট বড়">
          <Plus />
        </Button>
        <Button variant="ghost" size="icon" className={iconButton} onClick={toggleSpeech} title="পড়ে শোনান" aria-label="পড়ে শোনান">
          {speaking ? <VolumeX /> : <Volume2 />}
        </Button>
        <Button variant="ghost" size="sm" onClick={onComment}>
          <MessageCircle /> মন্তব্য
        </Button>
        <Button variant="ghost" size="sm" onClick={onReport}>
          <Flag /> রিপোর্ট
        </Button>
        {typeof navigator !== "undefined" && "share" in navigator ? (
          <Button
            variant="ghost"
            size="icon"
            className={iconButton}
            onClick={() => void navigator.share({ title, text: title, url }).catch(() => undefined)}
            title="আরও শেয়ার"
            aria-label="আরও শেয়ার"
          >
            <Share2 />
          </Button>
        ) : null}
      </div>
      <p className="sr-only">সংবাদ: {slug}</p>
    </div>
  );
}