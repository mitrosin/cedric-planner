import React from 'react';
import { 
  MDXEditor, 
  toolbarPlugin, 
  UndoRedo, 
  BoldItalicUnderlineToggles, 
  ListsToggle, 
  listsPlugin, 
  headingsPlugin, 
  quotePlugin, 
  thematicBreakPlugin, 
  markdownShortcutPlugin,
  BlockTypeSelect,
  linkPlugin,
  linkDialogPlugin,
  CreateLink,
  Separator,
  tablePlugin,
  InsertTable,
  codeBlockPlugin,
  codeMirrorPlugin,
  ConditionalContents,
  ChangeCodeMirrorLanguage,
  InsertCodeBlock
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { cn } from '../lib/utils';

interface NoteEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
  readOnly?: boolean;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ markdown, onChange, readOnly }) => {
  return (
    <div className={cn(
      "note-editor-wrapper min-h-[500px] flex flex-col w-full relative",
      readOnly && "read-only-editor"
    )}>
      <MDXEditor
        markdown={markdown}
        onChange={onChange}
        readOnly={readOnly}
        className="flex-1 flex flex-col w-full"
        contentEditableClassName="outline-none min-h-[500px] py-4 px-2 text-slate-800 dark:text-slate-200"
        plugins={[
          headingsPlugin({ allowedHeadingLevels: [1, 2, 3] }),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          tablePlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: 'javascript' }),
          codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS', html: 'HTML', ts: 'TypeScript', py: 'Python' } }),
          toolbarPlugin({
            toolbarContents: () => (
              <div className="flex flex-wrap items-center gap-1 py-2 px-4 -mx-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm transition-all text-sm">
                <UndoRedo />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <BoldItalicUnderlineToggles />
                <Separator />
                <ListsToggle />
                <Separator />
                <CreateLink />
                <InsertTable />
                <InsertCodeBlock />
              </div>
            )
          })
        ]}
      />
    </div>
  );
};
