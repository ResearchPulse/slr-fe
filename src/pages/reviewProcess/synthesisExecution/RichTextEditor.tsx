import { useCallback, useEffect, useMemo } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Bold, Italic, List, ListOrdered, Underline as UnderlineIcon } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  className?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeEditorValue(value: string): string {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return "<p><br></p>";
  }

  if (/<\/?[a-z][\s\S]*>/i.test(trimmedValue)) {
    return value;
  }

  const escapedValue = escapeHtml(value).replace(/\r?\n/g, "<br />");
  return `<p>${escapedValue}</p>`;
}

export default function RichTextEditor({ value, onChange, readOnly = false, className = "" }: RichTextEditorProps) {
  const editorValue = useMemo(() => normalizeEditorValue(value), [value]);

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: false }), Underline],
    content: editorValue,
    editable: !readOnly,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "min-h-[500px] px-6 py-5 text-base leading-7 text-gray-900 focus:outline-none prose max-w-none",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentHtml = editor.getHTML();
    if (currentHtml !== editorValue) {
      editor.commands.setContent(editorValue, false);
    }
  }, [editor, editorValue]);

  const applyFormat = useCallback(
    (format: "bold" | "italic" | "underline" | "bulletList" | "orderedList") => {
      if (!editor || readOnly) {
        return;
      }

      editor.chain().focus();

      if (format === "bold") {
        editor.chain().focus().toggleBold().run();
        return;
      }

      if (format === "italic") {
        editor.chain().focus().toggleItalic().run();
        return;
      }

      if (format === "underline") {
        editor.chain().focus().toggleUnderline().run();
        return;
      }

      if (format === "bulletList") {
        editor.chain().focus().toggleBulletList().run();
        return;
      }

      editor.chain().focus().toggleOrderedList().run();
    },
    [editor, readOnly],
  );

  return (
    <div
      className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 ${className}`}
    >
      <div className={`flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 ${readOnly ? "pointer-events-none opacity-60" : ""}`}>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => applyFormat("bold")} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition hover:bg-gray-100 ${editor?.isActive("bold") ? "border-blue-300 text-blue-700" : "border-gray-200 text-gray-700"}`} aria-label="Bold">
            <span className="sr-only">Bold</span>
            <Bold className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => applyFormat("italic")} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition hover:bg-gray-100 ${editor?.isActive("italic") ? "border-blue-300 text-blue-700" : "border-gray-200 text-gray-700"}`} aria-label="Italic">
            <span className="sr-only">Italic</span>
            <Italic className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => applyFormat("underline")} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition hover:bg-gray-100 ${editor?.isActive("underline") ? "border-blue-300 text-blue-700" : "border-gray-200 text-gray-700"}`} aria-label="Underline">
            <span className="sr-only">Underline</span>
            <UnderlineIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button type="button" onClick={() => applyFormat("bulletList")} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition hover:bg-gray-100 ${editor?.isActive("bulletList") ? "border-blue-300 text-blue-700" : "border-gray-200 text-gray-700"}`} aria-label="Bullet list">
            <span className="sr-only">Bullet list</span>
            <List className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => applyFormat("orderedList")} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition hover:bg-gray-100 ${editor?.isActive("orderedList") ? "border-blue-300 text-blue-700" : "border-gray-200 text-gray-700"}`} aria-label="Numbered list">
            <span className="sr-only">Numbered list</span>
            <ListOrdered className="h-4 w-4" />
          </button>
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}