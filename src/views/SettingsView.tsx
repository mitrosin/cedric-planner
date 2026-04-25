import React, { useRef, useState } from 'react';
import { RotateCcw, User, Mail, Lock, Trash2, Download, Upload, Loader2 } from 'lucide-react';
import { updateProfile, updateEmail, updatePassword, type User as FirebaseUser } from 'firebase/auth';
import { doc, updateDoc, writeBatch, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { cn } from '../lib/utils';

export interface SettingsViewProps {
  state: any;
  fetchData: (uid: string) => Promise<void>;
  user: FirebaseUser | null;
  setUser: (user: FirebaseUser | null) => void;
  userSettings: any;
  handleThemeChange: (theme: 'light' | 'dark') => Promise<void>;
  setConfirmation: (config: any) => void;
  setMessages: (updater: (prev: any[]) => any[]) => void;
  setShowToast: (show: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  state,
  fetchData,
  user,
  setUser,
  userSettings,
  handleThemeChange,
  setConfirmation,
  setMessages,
  setShowToast
}) => {
  const currentTheme = userSettings?.theme || 'light';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportBackup = () => {
    if (!state) return;
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cedric_planner_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMessages(prev => [...prev, { role: 'assistant', text: 'Backup exported successfully!' }]);
    setShowToast(true);
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setIsImporting(true);
    try {
      const text = await file.text();
      const importedData = JSON.parse(text);
      let totalItems = 0;
      
      const batch = writeBatch(db);
      
      const collections = ['tasks', 'habits', 'notes', 'lists', 'birthdays'];
      for (const col of collections) {
        if (Array.isArray(importedData[col])) {
          for (const item of importedData[col]) {
            if (item && item.id) {
              const ref = doc(db, 'users', user.uid, col, item.id);
              batch.set(ref, item);
              totalItems++;
            }
          }
        }
      }
      
      if (totalItems > 0) {
        await batch.commit();
        await fetchData(user.uid);
        setMessages(prev => [...prev, { role: 'assistant', text: `Backup imported successfully! Overwrote/updated ${totalItems} items.` }]);
        setShowToast(true);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: 'No valid items found in the backup file.' }]);
        setShowToast(true);
      }
    } catch (error: any) {
      console.error("Error importing backup:", error);
      setMessages(prev => [...prev, { role: 'assistant', text: 'Error importing backup: ' + error.message }]);
      setShowToast(true);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 pb-20 fade-in">
      
      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">General</h3>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
            {/* Theme Setting */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Theme</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Choose your preferred appearance</p>
                </div>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl shrink-0 self-start sm:self-auto">
                {(['light', 'dark'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => handleThemeChange(t)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer",
                      currentTheme === t 
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setConfirmation({ type: 'reset-data', isOpen: true })}
              className="w-full p-5 flex items-center gap-4 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/60 transition-colors shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors">Reset All Data</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Clear all tasks and habits</p>
              </div>
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">Account</h3>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden p-5 space-y-6">
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Display Name</label>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!user) return;
                  const formData = new FormData(e.currentTarget);
                  const newName = formData.get('name') as string;
                  try {
                    await updateProfile(user, { displayName: newName });
                    setMessages(prev => [...prev, { role: 'assistant', text: 'Name updated successfully!' }]);
                    setShowToast(true);
                    // Force local update
                    setUser({ ...user, displayName: newName } as FirebaseUser);
                  } catch(err: any) {
                    setMessages(prev => [...prev, { role: 'assistant', text: err.message }]);
                    setShowToast(true);
                  }
                }} className="flex gap-2">
                  <div className="relative flex-1">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      name="name"
                      defaultValue={user?.displayName || ''} 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none transition-all font-medium" 
                      placeholder="Your Name"
                    />
                  </div>
                  <button type="submit" className="px-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-sm shadow-md">Update</button>
                </form>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Email Address</label>
                {user?.providerData?.[0]?.providerId === 'google.com' ? (
                  <div className="w-full flex items-center justify-between pl-4 pr-4 py-3 bg-slate-50 dark:bg-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700 rounded-xl text-slate-500 font-medium">
                    <span>{user?.email}</span>
                    <span className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded-md">Google Login</span>
                  </div>
                ) : (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!user) return;
                    const formData = new FormData(e.currentTarget);
                    const newEmail = formData.get('email') as string;
                    try {
                      await updateEmail(user, newEmail);
                      setMessages(prev => [...prev, { role: 'assistant', text: 'Email updated successfully!' }]);
                      setShowToast(true);
                      setUser({ ...user, email: newEmail } as FirebaseUser);
                    } catch(err: any) {
                      setMessages(prev => [...prev, { role: 'assistant', text: "A recent login might be required. " + err.message }]);
                      setShowToast(true);
                    }
                  }} className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        name="email"
                        type="email"
                        defaultValue={user?.email || ''} 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none transition-all font-medium" 
                        placeholder="Email Address"
                      />
                    </div>
                    <button type="submit" className="px-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-sm shadow-md">Update</button>
                  </form>
                )}
              </div>

              {user?.providerData?.[0]?.providerId !== 'google.com' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Change Password</label>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!user) return;
                    const formData = new FormData(e.currentTarget);
                    const newPass = formData.get('password') as string;
                    try {
                      await updatePassword(user, newPass);
                      setMessages(prev => [...prev, { role: 'assistant', text: 'Password updated successfully!' }]);
                      setShowToast(true);
                      (e.target as HTMLFormElement).reset();
                    } catch(err: any) {
                      setMessages(prev => [...prev, { role: 'assistant', text: "Error: " + err.message }]);
                      setShowToast(true);
                    }
                  }} className="flex gap-2">
                    <div className="relative flex-1">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        name="password"
                        type="password"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none transition-all font-medium" 
                        placeholder="New Password"
                      />
                    </div>
                    <button type="submit" className="px-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-sm shadow-md">Update</button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">Backup</h3>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
            <button 
              onClick={handleExportBackup}
              className="w-full p-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60 transition-colors shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Export Backup Data</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Download a JSON file with all your tasks, habits, notes, and lists.</p>
              </div>
            </button>
            <div className="w-full p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/60 transition-colors shrink-0">
                  {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Import Backup Data</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Upload a previously exported JSON backup file.</p>
                </div>
              </div>
              <input 
                type="file" 
                accept="application/json" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImportBackup} 
                disabled={isImporting}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center shrink-0 self-start sm:self-auto"
              >
                Choose File
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-red-500 dark:text-red-400 uppercase tracking-wider mb-3 px-1">Danger Area</h3>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-red-100 dark:border-red-900/30 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
            <button 
              onClick={() => setConfirmation({ type: 'delete-account', isOpen: true })}
              className="w-full p-5 flex items-center gap-4 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-900/60 transition-colors shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">Delete Account</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Permanently remove your account and data</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
