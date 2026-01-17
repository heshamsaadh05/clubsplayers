import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Unlink,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Minus,
} from 'lucide-react';
import { Button } from './button';
import { Toggle } from './toggle';
import { Separator } from './separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './tooltip';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  dir?: 'rtl' | 'ltr';
  className?: string;
}

const RichTextEditor = ({
  content,
  onChange,
  placeholder = 'اكتب المحتوى هنا...',
  dir = 'rtl',
  className,
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-gold underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-invert max-w-none min-h-[200px] p-4 focus:outline-none',
          dir === 'rtl' && 'text-right'
        ),
        dir,
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="border border-border rounded-lg p-4 min-h-[200px] bg-secondary/50 animate-pulse" />
    );
  }

  const addLink = () => {
    const url = window.prompt('أدخل رابط URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const ToolbarButton = ({
    onClick,
    active,
    disabled,
    children,
    tooltip,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    tooltip: string;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          size="sm"
          pressed={active}
          onPressedChange={onClick}
          disabled={disabled}
          className="h-8 w-8 p-0 data-[state=on]:bg-gold/20 data-[state=on]:text-gold"
        >
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );

  return (
    <div className={cn('border border-border rounded-lg overflow-hidden bg-secondary/50', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/50">
        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          tooltip="عريض"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          tooltip="مائل"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          tooltip="تسطير"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          tooltip="يتوسطه خط"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          tooltip="عنوان رئيسي"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          tooltip="عنوان فرعي"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          tooltip="عنوان صغير"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          tooltip="قائمة نقطية"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          tooltip="قائمة مرقمة"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          tooltip="اقتباس"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          tooltip="محاذاة لليمين"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          tooltip="توسيط"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          tooltip="محاذاة لليسار"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Link */}
        <ToolbarButton
          onClick={addLink}
          active={editor.isActive('link')}
          tooltip="إضافة رابط"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
          tooltip="إزالة الرابط"
        >
          <Unlink className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Horizontal Rule */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          tooltip="خط فاصل"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <div className="flex-1" />

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          tooltip="تراجع"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          tooltip="إعادة"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Placeholder */}
      {editor.isEmpty && (
        <div className="absolute top-[60px] right-4 text-muted-foreground pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
