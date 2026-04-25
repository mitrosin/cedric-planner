import React from 'react';
import { Info, Code, Shield } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="space-y-6 pb-20 fade-in max-w-3xl">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold dark:text-slate-100">About Cedric Planner</h2>
            <p className="text-sm font-medium text-slate-500">Version 1.0.0</p>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
          Cedric Planner is an AI-powered personal organizer designed to help you streamline your daily routines. 
          By combining natural language processing with robust task, habit, note, and list management features, 
          it allows you to manage your schedule conversationally. Just tell the AI what you want to achieve, 
          and it organizes the data for you.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <Code className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold dark:text-slate-100">Technologies Used</h3>
        </div>
        <div className="p-0">
          <ul className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
            {[
              { name: 'React', desc: 'UI Library for declarative component-based views.', license: 'MIT License' },
              { name: 'Vite', desc: 'Next-generation frontend tooling for fast development.', license: 'MIT License' },
              { name: 'Tailwind CSS', desc: 'Utility-first CSS framework for rapid UI development.', license: 'MIT License' },
              { name: 'Firebase', desc: 'Backend-as-a-Service providing Auth, Firestore, and Hosting.', license: 'Apache License 2.0' },
              { name: 'Google Gemini', desc: 'Large language model powering the conversational interface.', license: 'Google Cloud Terms of Service' },
              { name: 'Recharts', desc: 'Composable charting library built on React components.', license: 'MIT License' },
              { name: 'Lucide React', desc: 'Beautiful & consistent icons framework.', license: 'ISC License' },
              { name: 'date-fns', desc: 'Modern JavaScript date utility library.', license: 'MIT License' },
            ].map((tech, i) => (
              <li key={i} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">{tech.name}</h4>
                  <p className="text-slate-500 text-xs mt-0.5">{tech.desc}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md self-start sm:self-center shrink-0">
                  <Shield className="w-3.5 h-3.5" /> {tech.license}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
