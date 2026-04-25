import React, { useState } from 'react';
import { CheckSquare, ChevronLeft, Check, Edit2, Trash2, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

export interface ListsViewProps {
  lists: any[];
  activeListId: string | null;
  setActiveListId: (id: string | null) => void;
  handleUpdateListItems: (listId: string, items: any[]) => Promise<void>;
  handleEditClick: (type: 'list', data: any, context: 'tab') => void;
  handleDelete: (type: 'list', id: string, context: 'tab') => void;
  setEditingListItem: (item: {listId: string, itemId: string, title: string} | null) => void;
  setNewListItemTitle: (title: string) => void;
  listInput: string;
  setListInput: (input: string) => void;
  handleAddNewItem: (type: 'list') => void;
}

export const ListsView: React.FC<ListsViewProps> = ({
  lists,
  activeListId,
  setActiveListId,
  handleUpdateListItems,
  handleEditClick,
  handleDelete,
  setEditingListItem,
  setNewListItemTitle,
  listInput,
  setListInput,
  handleAddNewItem
}) => {
  if (!lists?.length && !activeListId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-6 fade-in">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/50 rounded-xl flex items-center justify-center">
          <CheckSquare className="w-10 h-10 opacity-20" />
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-800 dark:text-slate-100">No lists yet</p>
          <p className="text-sm font-medium mt-1">Start organizing your ideas today</p>
        </div>
        <button 
          onClick={() => handleAddNewItem('list')}
          className="px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Create first list
        </button>
      </div>
    );
  }

  if (activeListId) {
    const list = lists?.find(l => l.id === activeListId);
    if (!list) {
      // In a real scenario, this might need to run in a useEffect, but it's safe if it just renders null briefly
      setTimeout(() => setActiveListId(null), 0);
      return null;
    }
    
    const items = list.items || [];
    const completedCount = items.filter((i: any) => i.done).length;
    const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

    const handleAddItem = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!listInput.trim()) return;
      const newItems = [...items, { id: Date.now().toString(), title: listInput.trim(), done: false }];
      setListInput('');
      await handleUpdateListItems(list.id, newItems);
    };

    const toggleItem = async (itemId: string) => {
      const newItems = items.map((i: any) => i.id === itemId ? { ...i, done: !i.done } : i);
      await handleUpdateListItems(list.id, newItems);
    };

    const deleteItem = async (itemId: string) => {
      const newItems = items.filter((i: any) => i.id !== itemId);
      await handleUpdateListItems(list.id, newItems);
    };

    return (
      <div className="space-y-4 pb-40 fade-in">
        <button onClick={() => setActiveListId(null)} className="text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 mb-4 cursor-pointer">
          <ChevronLeft className="w-4 h-4"/> Back to Lists
        </button>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-baseline justify-end mb-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {items.length} {items.length === 1 ? 'item' : 'items'} ({completedCount} done)
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 mb-6 overflow-hidden">
            <div className="bg-purple-600 h-2.5 transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          
          <div className="space-y-2 mb-6">
            {items.map((item: any) => (
              <div key={item.id} className={cn(
                "flex items-center gap-3 p-4 rounded-xl border group transition-all shadow-[0_4px_12px_-4px_rgba(0,0,0,0.06)]",
                item.done 
                  ? "border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-60" 
                  : "border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800"
              )}>
                <button onClick={() => toggleItem(item.id)} className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all border-2 cursor-pointer shadow-sm", item.done ? "bg-purple-600 border-purple-600 text-white" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:border-purple-400")}>
                  {item.done && <Check className="w-4 h-4" />}
                </button>
                <span className={cn("flex-1 text-sm font-semibold transition-all text-slate-700 dark:text-slate-200", item.done && "line-through grayscale opacity-50")}>{item.title}</span>
                {!item.done && (
                  <button 
                    onClick={() => { setEditingListItem({ listId: list.id, itemId: item.id, title: item.title }); setNewListItemTitle(item.title); }} 
                    className="p-2 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-500 rounded-xl cursor-pointer transition-all hover:shadow-sm text-slate-400"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <div className="w-1" /> {/* Spacer */}
                <button 
                  onClick={() => deleteItem(item.id)} 
                  className="p-2 border border-slate-100 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 rounded-xl cursor-pointer transition-all hover:shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {items.length === 0 && <p className="text-sm text-slate-400 font-medium italic">No items yet</p>}
          </div>
          
          <form onSubmit={handleAddItem} className="flex gap-2">
            <input type="text" value={listInput} onChange={e => setListInput(e.target.value)} placeholder="Add new item..." className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all dark:text-slate-100" />
            <button type="submit" disabled={!listInput.trim()} className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 rounded-xl font-bold flex items-center justify-center disabled:opacity-50 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors cursor-pointer">
              Add
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-40 fade-in">
      <div className="flex flex-col gap-4">
        {(lists || []).map((list) => {
          const items = list.items || [];
          const completedCount = items.filter((i: any) => i.done).length;
          const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;
          
          return (
            <div key={list.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)] transition-shadow relative group cursor-pointer" onClick={() => setActiveListId(list.id)}>
              <div className="absolute top-4 right-4 flex items-center gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleEditClick('list', list, 'tab'); }} 
                  className="p-2 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-500 rounded-xl cursor-pointer transition-all hover:shadow-sm text-slate-400"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete('list', list.id, 'tab'); }} 
                  className="p-2 border border-slate-100 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 rounded-xl cursor-pointer transition-all hover:shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-bold text-slate-900 dark:text-slate-100 pr-24 break-words leading-tight mb-2">{list.title}</h3>
              <p className="text-xs font-medium text-slate-500 mb-4">{items.length} items ({completedCount} done)</p>
              
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div className="bg-purple-600 h-1.5 transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
