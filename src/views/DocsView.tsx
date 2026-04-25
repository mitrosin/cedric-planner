import React from 'react';
import { BookOpen, CheckSquare, Repeat, List, FileText, Settings, Key, Command, Box } from 'lucide-react';

export const DocsView: React.FC = () => {
  const sections = [
    {
      title: 'AI Conversational Interface',
      icon: <Command className="w-5 h-5 text-purple-500" />,
      content: 'At the heart of Cedric Planner is the AI assistant. Use the chat input at the bottom of the screen to talk to the planner. You can say things like "I want to go to the gym every monday", "Remind me to call John tomorrow", or "Create a shopping list with milk and bread". The AI understands context and acts accordingly to create, update, or delete your data.'
    },
    {
      title: 'Schedule (Timeline)',
      icon: <Box className="w-5 h-5 text-blue-500" />,
      content: 'The Schedule view shows your tasks and habits organized chronologically. Items without a specific time appear at the "Anytime" block. You can build your day by dragging and dropping tasks to reorder them.'
    },
    {
      title: 'Tasks',
      icon: <CheckSquare className="w-5 h-5 text-emerald-500" />,
      content: 'Tasks are one-off to-dos. They can have a due date, time, and priority. You can mark them as complete by clicking their circle. Deleting a completed task will remove it forever. You can also view overdue tasks in the "Unfinished" tab.'
    },
    {
      title: 'Habits',
      icon: <Repeat className="w-5 h-5 text-amber-500" />,
      content: 'Habits are recurring activities. You can set them to repeat daily or on specific days of the week. Habits are tracked over time, and you can view your completion history in the habit\'s Heatmap graph.'
    },
    {
      title: 'Lists',
      icon: <List className="w-5 h-5 text-rose-500" />,
      content: 'Lists are collections of items. Use them for groceries, packing lists, meeting agendas, etc. Each list can contain multiple checkable items. You can ask the AI to "add apples to my groceries list".'
    },
    {
      title: 'Notes',
      icon: <FileText className="w-5 h-5 text-cyan-500" />,
      content: 'Notes are for long-form text, ideas, or journaling. They support Markdown, meaning you can write bold text, lists, and headings. Ask the AI to draft an email and save it as a note!'
    },
    {
      title: 'Settings & Data Backup',
      icon: <Settings className="w-5 h-5 text-slate-500" />,
      content: 'In the Settings page, you can customize the application theme, manage your Firebase account (email/password), and Backup your data. Use the Export button to save all your data to a locally stored JSON file, which you can Import later to restore.'
    }
  ];

  return (
    <div className="space-y-6 pb-20 fade-in max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold dark:text-slate-100">Documentation</h2>
          <p className="text-sm font-medium text-slate-500">Learn how to use Cedric Planner</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-5 sm:p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              {section.icon}
              <h3 className="font-bold text-slate-900 dark:text-slate-100">{section.title}</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
