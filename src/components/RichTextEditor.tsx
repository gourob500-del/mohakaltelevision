import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

const btn =
  "inline-flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-foreground hover:bg-muted disabled:opacity-40";
const btnOn = "bg-primary text-primary-foreground border-primary hover:bg-primary/90";

export function RichTextEditor({ value, onChange, placeholder = "সংবাদের বিস্তারিত লিখুন..." }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true, protocols: ["http", "https"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[220px] px-3 py-2 focus:outline-none text-foreground",
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || "") !== current) editor.commands.setContent(value || "", { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) {
    return <div className="min-h-[260px] rounded-md border border-input bg-background" />;
  }

  const is = (name: string, attrs?: Record<string, unknown>) =>
    editor.isActive(name, attrs) ? `${btn} ${btnOn}` : btn;

  return (
    <div className="rounded-md border border-input bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
        <button type="button" className={is("bold")} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="বোল্ড">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" className={is("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="ইটালিক">
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={is("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-label="শিরোনাম"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button type="button" className={is("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="তালিকা">
          <List className="h-4 w-4" />
        </button>
        <button type="button" className={is("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="সংখ্যা তালিকা">
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" className={is("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} aria-label="উদ্ধৃতি">
          <Quote className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={is("link")}
          aria-label="লিংক"
          onClick={() => {
            const prev = editor.getAttributes("link")['href'] as string | undefined;
            const url = window.prompt("লিংক (https://...)", prev ?? "https://");
            if (url === null) return;
            if (!url.trim()) {
              editor.chain().focus().unsetLink().run();
              return;
            }
            if (!/^https?:\/\//i.test(url.trim())) {
              window.alert("লিংক অবশ্যই http বা https দিয়ে শুরু হতে হবে।");
              return;
            }
            editor.chain().focus().setLink({ href: url.trim() }).run();
          }}
        >
          <Link2 className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" className={btn} onClick={() => editor.chain().focus().undo().run()} aria-label="আনডু">
          <Undo2 className="h-4 w-4" />
        </button>
        <button type="button" className={btn} onClick={() => editor.chain().focus().redo().run()} aria-label="রিডু">
          <Redo2 className="h-4 w-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
