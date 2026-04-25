import React, { useState, useRef, useEffect } from 'react';
import { Send, Calendar, CheckSquare, Repeat, Clock, Loader2, X, Edit2, Trash2, Check, ChevronLeft, ChevronRight, Menu, LogOut, User, Mail, Lock, RotateCcw, Plus, Eye, EyeOff, Pencil, Sparkles, Search, FileText, Save, Cake } from 'lucide-react';
import { processPlannerInput, type PlannerState } from './lib/gemini';
import { cn, withTimeout, cleanUndefined } from './lib/utils';
import { OperationType, handleFirestoreError } from './lib/firebaseUtils';
import { ConfirmationModal } from './components/ConfirmationModal';
import { TaskItem } from './components/TaskItem';
import { HabitItem } from './components/HabitItem';
import { ScheduleTimelineItem } from './components/ScheduleTimelineItem';
import { BulkActions } from './components/BulkActions';
import { SideNav } from './components/SideNav';
import { EditModal } from './components/EditModal';
import { EditBirthdayModal } from './components/EditBirthdayModal';
import { NoteItem } from './components/NoteItem';
import { NoteEditor } from './components/NoteEditor';
import { BirthdayItem } from './components/BirthdayItem';
import { TasksView } from './views/TasksView';
import { HabitsView } from './views/HabitsView';
import { UnfinishedView } from './views/UnfinishedView';
import { ListsView } from './views/ListsView';
import { NotesView } from './views/NotesView';
import { NoteDetailView } from './views/NoteDetailView';
import { BirthdaysView } from './views/BirthdaysView';
import { SettingsView } from './views/SettingsView';
import { AboutView } from './views/AboutView';
import { DocsView } from './views/DocsView';
import { HABIT_COLORS } from './constants';
import { formatDateLabel } from './lib/dateUtils';
import ReactMarkdown from 'react-markdown';
import { 
  DragEndEvent,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { format, addDays, isSameDay, startOfToday, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { auth, db } from './lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  updateEmail,
  updatePassword,
  deleteUser,
  type User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  updateDoc,
  getDoc, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  deleteDoc, 
  writeBatch,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';



import { AuthPage } from './components/AuthPage';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activePage, setActivePage] = useState<'schedule' | 'tasks' | 'habits' | 'unfinished' | 'settings' | 'lists' | 'notes' | 'note-detail' | 'birthdays' | 'about' | 'docs'>('schedule');
  const [state, setState] = useState<PlannerState>({
    tasks: [],
    habits: [],
    lists: [],
    notes: [],
    birthdays: []
  });
  const [userSettings, setUserSettings] = useState<{ defaultHabitColor?: string, theme?: 'light' | 'dark' | 'system', aiUsage?: { count: number, date: string } }>({});
  const [summary, setSummary] = useState<string>('Welcome to Cedric Planner. Add a task or habit to get started.');
  const [messages, setMessages] = useState<{role: 'user'|'assistant', text: string}[]>([]);
  const [showToast, setShowToast] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingItem, setEditingItem] = useState<{type: 'task'|'habit'|'list', data: any, context?: 'schedule'|'tab'} | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteEditorMode, setNoteEditorMode] = useState<'view' | 'edit'>('view');
  const [listInput, setListInput] = useState('');
  const [noteEditDraft, setNoteEditDraft] = useState<{ id: string, title: string, content: string } | null>(null);
  const [isSavingNote, setIsSavingNote] = useState(false);

  const [birthdayName, setBirthdayName] = useState('');
  const [birthdayMonth, setBirthdayMonth] = useState('01');
  const [birthdayDay, setBirthdayDay] = useState('01');
  const [editingBirthdayData, setEditingBirthdayData] = useState<any>(null);
  const [isSubmittingBirthday, setIsSubmittingBirthday] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync note draft when activeNoteId changes or edit mode enters
  useEffect(() => {
    if (activeNoteId && activePage === 'note-detail') {
      const note = state.notes?.find(n => n.id === activeNoteId);
      if (note) {
        setNoteEditDraft({
          id: activeNoteId,
          title: note.title || '',
          content: note.content || ''
        });
      }
    } else if (activePage !== 'note-detail') {
      setNoteEditDraft(null);
    }
  }, [activeNoteId, activePage, state.notes]);

  const handleEditClick = (type: 'task' | 'habit' | 'list', data: any, context: 'schedule' | 'tab') => {
    setEditingItem({ type, data, context });
  };
  
  const handleAddNewItem = (type: 'task' | 'habit' | 'list' | 'note') => {
    setIsAddMenuOpen(false);
    
    if (type === 'note') {
      handleCreateNote();
      return;
    }
    
    // We base the start times off roundedNow (representing user's current clock or intention)
    const roundedNow = new Date();
    if (roundedNow.getMinutes() > 0 || roundedNow.getSeconds() > 0) {
      roundedNow.setHours(roundedNow.getHours() + 1);
      roundedNow.setMinutes(0);
      roundedNow.setSeconds(0);
      roundedNow.setMilliseconds(0);
    }
    
    const startTimeStr = format(roundedNow, 'HH:mm');
    const endNow = addDays(roundedNow, 0); 
    endNow.setHours(roundedNow.getHours() + 1);
    const endTimeStr = format(endNow, 'HH:mm');

    // Default data uses the selected date in the calendar!
    const data: any = {
      title: '',
    };
    
    if (type === 'task') {
      data.start_time = startTimeStr;
      data.end_time = endTimeStr;
      data.estimated_duration_minutes = 60;
      data.date = selectedDateStr;
      data.priority = 'medium';
    } else if (type === 'habit') {
      data.start_time = startTimeStr;
      data.end_time = endTimeStr;
      data.estimated_duration_minutes = 60;
      data.start_date = selectedDateStr;
      data.frequency_type = 'weekly';
      try {
        data.frequency_detail = [format(parseISO(selectedDateStr), 'EEEE')];
      } catch (e) {
        data.frequency_detail = ['Monday'];
      }
    } else if (type === 'list') {
      data.items = [];
    }
    
    setEditingItem({ type, data, context: 'tab' });
  };

  const [confirmation, setConfirmation] = useState<{
    type: 'delete-account' | 'reset-data' | 'delete-habit' | 'delete-task' | 'delete-list' | 'delete-note' | 'delete-birthday';
    isOpen: boolean;
    data?: any;
  } | null>(null);

  const [editingListItem, setEditingListItem] = useState<{listId: string, itemId: string, title: string} | null>(null);
  const [newListItemTitle, setNewListItemTitle] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedDateRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  const todayTime = startOfToday().getTime();
  const days = React.useMemo(() => {
    const arr = [];
    const baseDate = new Date(todayTime);
    // 7 days in the past to 21 days in the future (total 28 days)
    for (let i = -7; i < 21; i++) {
      arr.push(addDays(baseDate, i));
    }
    return arr;
  }, [todayTime]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const isPasswordProvider = u.providerData?.some(p => p.providerId === 'password');
        if (isPasswordProvider && !u.emailVerified) {
          await signOut(auth);
          setUser(null);
          setAuthReady(true);
          return;
        }
      }
      setUser(u);
      if (u) {
        setActivePage('schedule'); // Always show Schedule on login
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Data Sync
  const fetchData = async (uid: string) => {
    try {
      setIsRefetching(true);
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) setUserSettings(userDoc.data()?.settings || {});

      const tasksRef = collection(db, 'users', uid, 'tasks');
      const tasksSnap = await getDocs(tasksRef);
      const tasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const habitsRef = collection(db, 'users', uid, 'habits');
      const habitsSnap = await getDocs(habitsRef);
      const habits = habitsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

      const listsRef = collection(db, 'users', uid, 'lists');
      const listsSnap = await getDocs(listsRef);
      const lists = listsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const notesRef = collection(db, 'users', uid, 'notes');
      const notesSnap = await getDocs(notesRef);
      const notes = notesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const birthdaysRef = collection(db, 'users', uid, 'birthdays');
      const birthdaysSnap = await getDocs(birthdaysRef);
      const birthdays = birthdaysSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setState({ tasks, habits, lists, notes, birthdays });
      
      setMessages(prev => [...prev, { role: 'assistant', text: 'Data refreshed successfully' }]);
      setShowToast(true);
    } catch (e: any) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', text: 'Error refreshing data: ' + e.message }]);
      setShowToast(true);
    } finally {
      setIsRefetching(false);
    }
  };

  useEffect(() => {
    const theme = userSettings.theme || 'light';
    const root = document.documentElement;
    
    const applyTheme = (t: 'light' | 'dark' | 'system') => {
      let resolvedTheme: 'light' | 'dark' = 'light';
      if (t === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolvedTheme = t;
      }

      if (resolvedTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(theme);
  }, [userSettings.theme]);

  useEffect(() => {
    if (!user) {
      setState({ tasks: [], habits: [], lists: [], notes: [], birthdays: [] });
      setUserSettings({});
      setIsLoading(false);
      setEditingItem(null);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubSettings = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setUserSettings(doc.data()?.settings || {});
      }
    }, (error) => {
      console.error("Settings listener error:", error);
    });

    const tasksRef = collection(db, 'users', user.uid, 'tasks');
    const habitsRef = collection(db, 'users', user.uid, 'habits');
    const listsRef = collection(db, 'users', user.uid, 'lists');
    const notesRef = collection(db, 'users', user.uid, 'notes');
    const birthdaysRef = collection(db, 'users', user.uid, 'birthdays');

    const unsubTasks = onSnapshot(tasksRef, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setState(prev => ({ ...prev, tasks }));
    }, (error) => {
      console.error("Tasks listener error:", error);
    });

    const unsubHabits = onSnapshot(habitsRef, (snapshot) => {
      const habits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      setState(prev => ({ ...prev, habits }));
    }, (error) => {
      console.error("Habits listener error:", error);
    });

    const unsubLists = onSnapshot(listsRef, (snapshot) => {
      const lists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setState(prev => ({ ...prev, lists }));
    }, (error) => {
      console.error("Lists listener error:", error);
    });

    const unsubNotes = onSnapshot(notesRef, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setState(prev => ({ ...prev, notes }));
    }, (error) => {
      console.error("Notes listener error:", error);
    });

    const unsubBirthdays = onSnapshot(birthdaysRef, (snapshot) => {
      const birthdays = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setState(prev => ({ ...prev, birthdays }));
    }, (error) => {
      console.error("Birthdays listener error:", error);
    });

    return () => {
      unsubSettings();
      unsubTasks();
      unsubHabits();
      unsubLists();
      unsubNotes();
      unsubBirthdays();
    };
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedDateRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const button = selectedDateRef.current;
      const scrollLeft = button.offsetLeft - container.offsetLeft - (container.clientWidth / 2) + (button.clientWidth / 2);
      // Wait for paint to ensure correct scrolling position
      setTimeout(() => {
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }, 50);
    }
  }, [selectedDate, authReady, user, activePage, isMobile]);

  const scrollCalendar = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userText = input.trim();
    
    // Check AI Limits
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const aiUsageCount = userSettings.aiUsage?.date === todayStr ? (userSettings.aiUsage?.count || 0) : 0;
    
    if (aiUsageCount >= 10) {
      setMessages(prev => [...prev, { role: 'user', text: userText }, { role: 'assistant', text: "You have reached your daily limit of 10 AI inputs. Please try again tomorrow!" }]);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      return;
    }

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);
    setShowToast(true);

    const currentDateStr = format(new Date(), 'yyyy-MM-dd');
    const currentTimeStr = format(new Date(), 'HH:mm');

    try {
      const result = await processPlannerInput(userText, state, currentDateStr, currentTimeStr, selectedDateStr);
      
      const batch = writeBatch(db);
      
      // Update AI Usage count in Firestore
      const userRef = doc(db, 'users', user.uid);
      batch.update(userRef, { 'settings.aiUsage': { date: todayStr, count: aiUsageCount + 1 } });
      
      result.added_tasks?.forEach((task: any) => {
        task.estimated_duration_minutes = Number(task.estimated_duration_minutes) || 15;
        if (!['low', 'medium', 'high'].includes(task.priority)) task.priority = 'medium';
        const taskRef = doc(db, 'users', user.uid, 'tasks', task.id);
        batch.set(taskRef, cleanUndefined({ ...task, uid: user.uid, createdAt: new Date().toISOString() }));
      });

      result.added_habits?.forEach((habit: any) => {
        habit.estimated_duration_minutes = Number(habit.estimated_duration_minutes) || 15;
        const habitRef = doc(db, 'users', user.uid, 'habits', habit.id);
        batch.set(habitRef, cleanUndefined({ ...habit, uid: user.uid, createdAt: new Date().toISOString() }));
      });

      result.added_lists?.forEach((list: any) => {
        const listRef = doc(db, 'users', user.uid, 'lists', list.id);
        batch.set(listRef, cleanUndefined({ ...list, uid: user.uid, createdAt: new Date().toISOString() }));
      });

      result.added_notes?.forEach((note: any) => {
        const noteRef = doc(db, 'users', user.uid, 'notes', note.id);
        batch.set(noteRef, cleanUndefined({ ...note, uid: user.uid, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
      });

      result.added_birthdays?.forEach((birthday: any) => {
        const birthdayRef = doc(db, 'users', user.uid, 'birthdays', birthday.id);
        const birthDate = `${String(birthday.month).padStart(2, '0')}-${String(birthday.day).padStart(2, '0')}`;
        batch.set(birthdayRef, cleanUndefined({ ...birthday, birthDate, uid: user.uid, createdAt: new Date().toISOString() }));
      });

      await withTimeout(batch.commit(), 10000, "Firestore batch commit timed out");
      
      setSummary(result.summary);
      setMessages(prev => [...prev, { role: 'assistant', text: result.message }]);
      
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setShowToast(false), 5000);

      if ((result.added_tasks?.length > 0 || result.added_habits?.length > 0) && activePage !== 'schedule') {
        setActivePage('schedule');
      } else if (result.added_lists?.length > 0 && activePage !== 'lists') {
        setActivePage('lists');
      } else if (result.added_notes?.length > 0 && activePage !== 'notes') {
        setActivePage('notes');
      } else if (result.added_birthdays?.length > 0 && activePage !== 'birthdays') {
        setActivePage('birthdays');
      }
    } catch (error) {
      console.error("Error processing input:", error);
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I encountered an error processing that request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async (updatedData: any) => {
    console.log("handleSaveEdit started", updatedData);
    if (!editingItem || !user) return;
    
    const { type, context } = editingItem;
    // Generate a new ID if this is a new item being created manually
    const itemId = updatedData.id || doc(collection(db, 'users')).id;
    
    // UI-only fields cleanup
    const { type: _t, time: _tm, ...dataToSave } = updatedData;
    
    // Ensure the generated or existing item ID is present in the data to be saved
    dataToSave.id = itemId;

    try {
      const cleanData = cleanUndefined(dataToSave);
      
      // Calculate duration from start_time and end_time
      if (cleanData.start_time && cleanData.end_time) {
        const [sh, sm] = cleanData.start_time.split(':').map(Number);
        const [eh, em] = cleanData.end_time.split(':').map(Number);
        const startMins = (sh || 0) * 60 + (sm || 0);
        const endMins = (eh || 0) * 60 + (em || 0);
        if (endMins > startMins) {
          cleanData.estimated_duration_minutes = endMins - startMins;
        }
      }
      
      if (cleanData.estimated_duration_minutes !== undefined) {
        cleanData.estimated_duration_minutes = Number(cleanData.estimated_duration_minutes) || 15;
      }
      if (cleanData.priority !== undefined && !['low', 'medium', 'high'].includes(cleanData.priority)) {
        cleanData.priority = 'medium';
      }
      
      cleanData.uid = user.uid;
      if (!updatedData.id) {
        cleanData.createdAt = new Date().toISOString();
        if (type === 'task') cleanData.completed = false;
      }
      
      if (type === 'task') {
        console.log("Saving task...");
        await withTimeout(
          setDoc(doc(db, 'users', user.uid, 'tasks', itemId), cleanData, { merge: true }),
          10000,
          "Firestore setDoc timed out"
        );
      } else if (type === 'list') {
        console.log("Saving list...");
        if (!updatedData.id) cleanData.items = [];
        await withTimeout(
          setDoc(doc(db, 'users', user.uid, 'lists', itemId), cleanData, { merge: true }),
          10000,
          "Firestore setDoc timed out"
        );
        if (!updatedData.id) {
          setActivePage('lists');
          setActiveListId(itemId);
        }
      } else if (type === 'habit') {
        const habitRef = doc(db, 'users', user.uid, 'habits', itemId);
        if (context === 'schedule') {
          console.log("Saving habit override for date:", selectedDateStr);
          await withTimeout(
            setDoc(habitRef, {
              overrides: {
                [selectedDateStr]: cleanData
              }
            }, { merge: true }),
            10000,
            "Firestore setDoc timed out"
          );
        } else {
          console.log("Saving global habit...");
          await withTimeout(
            setDoc(habitRef, cleanData, { merge: true }),
            10000,
            "Firestore setDoc timed out"
          );
        }
      }
      console.log("Save successful");
    } catch (error) {
      console.error("Error saving edit:", error);
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/${type}s/${itemId}`);
    } finally {
      setEditingItem(null);
    }
  };

  const handleDelete = async (type: 'task'|'habit'|'list', id: string, context: 'schedule'|'tab' = 'tab') => {
    if (!user) return;
    
    if (type === 'task') {
      setConfirmation({
        type: 'delete-task',
        isOpen: true,
        data: { id }
      });
      return;
    }

    if (type === 'list') {
      setConfirmation({
        type: 'delete-list',
        isOpen: true,
        data: { id }
      });
      return;
    }

    if (type === 'habit' && context === 'tab') {
      setConfirmation({
        type: 'delete-habit',
        isOpen: true,
        data: { id }
      });
      return;
    }

    try {
      if (type === 'habit') {
        if (context === 'schedule') {
          const habitRef = doc(db, 'users', user.uid, 'habits', id);
          const habitSnap = await getDoc(habitRef);
          if (habitSnap.exists()) {
            const h = habitSnap.data();
            const skipped_dates = [...(h.skipped_dates || []), selectedDateStr];
            await setDoc(habitRef, { skipped_dates }, { merge: true });
          }
        }
      }
    } catch (error) {
      console.error("Error deleting:", error);
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/${type}s/${id}`);
    }
  };

  const confirmDeleteTask = async () => {
    if (!user || !confirmation?.data?.id) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'tasks', confirmation.data.id));
      setConfirmation(null);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const confirmDeleteList = async () => {
    if (!user || !confirmation?.data?.id) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'lists', confirmation.data.id));
      setConfirmation(null);
      if (activeListId === confirmation.data.id) {
        setActiveListId(null);
      }
    } catch (error) {
      console.error("Error deleting list:", error);
    }
  };

  const confirmDeleteHabit = async () => {
    if (!user || !confirmation?.data?.id) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'habits', confirmation.data.id));
      setConfirmation(null);
    } catch (error) {
      console.error("Error deleting habit:", error);
    }
  };

  const toggleSelection = (id: string, date?: string) => {
    const key = date ? `${id}:${date}` : id;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(key => {
        const [id] = key.split(':');
        const isTask = (state.tasks || []).some(t => t.id === id);
        const collectionName = isTask ? 'tasks' : 'habits';
        batch.delete(doc(db, 'users', user.uid, collectionName, id));
      });
      await batch.commit();
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Error bulk deleting:", error);
    }
  };

  const handleMarkDone = async () => {
    if (!user || selectedIds.size === 0) return;
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(key => {
        const [id, date] = key.split(':');
        const task = (state.tasks || []).find(t => t.id === id);
        const habit = (state.habits || []).find(h => h.id === id);
        
        if (task) {
          const taskRef = doc(db, 'users', user.uid, 'tasks', id);
          batch.update(taskRef, { completed: true });
        } else if (habit) {
          const habitRef = doc(db, 'users', user.uid, 'habits', id);
          const effectiveDate = date || selectedDateStr;
          const completed_dates = Array.from(new Set([...(habit.completed_dates || []), effectiveDate]));
          batch.update(habitRef, { completed_dates });
        }
      });
      await batch.commit();
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Error marking done:", error);
    }
  };

  const handleRestore = async () => {
    if (!user || selectedIds.size === 0) return;
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(key => {
        const [id, date] = key.split(':');
        const task = (state.tasks || []).find(t => t.id === id);
        const habit = (state.habits || []).find(h => h.id === id);
        
        if (task) {
          const taskRef = doc(db, 'users', user.uid, 'tasks', id);
          batch.update(taskRef, { completed: false });
        } else if (habit) {
          const habitRef = doc(db, 'users', user.uid, 'habits', id);
          const effectiveDate = date || selectedDateStr;
          const completed_dates = (habit.completed_dates || []).filter((d: string) => d !== effectiveDate);
          batch.update(habitRef, { completed_dates });
        }
      });
      await batch.commit();
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Error restoring:", error);
    }
  };

  const handleSaveListItemEdit = async () => {
    if (!editingListItem || !user || !newListItemTitle.trim()) return;
    const list = (state.lists || []).find(l => l.id === editingListItem.listId);
    if (!list) return;
    
    const newItems = (list.items || []).map((i: any) => 
      i.id === editingListItem.itemId ? { ...i, title: newListItemTitle.trim() } : i
    );
    
    await handleUpdateListItems(list.id, newItems);
    setEditingListItem(null);
    setNewListItemTitle('');
  };

  const handleCreateNote = async () => {
    if (!user) return;
    const newNote = {
      title: 'Untitled Note',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      uid: user.uid
    };
    try {
      const notesRef = collection(db, 'users', user.uid, 'notes');
      const docRef = doc(notesRef);
      await setDoc(docRef, newNote);
      setActiveNoteId(docRef.id);
      setNoteEditorMode('edit');
      setActivePage('note-detail');
    } catch (err) {
      console.error("Error creating note:", err);
    }
  };

  const handleSaveNote = async (id: string, updates: { title?: string, content?: string }) => {
    if (!user) return;
    try {
      const noteRef = doc(db, 'users', user.uid, 'notes', id);
      await updateDoc(noteRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error saving note:", err);
    }
  };

  const handleDeleteNote = (id: string) => {
    setConfirmation({
      type: 'delete-note',
      isOpen: true,
      data: id
    });
  };

  const handleSaveBirthdayEdit = async (id: string, name: string, birthDate: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'birthdays', id), {
        name,
        birthDate,
        updatedAt: new Date().toISOString()
      });
      setMessages(prev => [...prev, { role: 'assistant', text: `Birthday for ${name} updated successfully.` }]);
      setShowToast(true);
      setEditingBirthdayData(null);
    } catch (error) {
      console.error("Error updating birthday:", error);
      handleFirestoreError(error, OperationType.UPDATE, 'birthdays');
    }
  };

  const handleSaveBirthday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !birthdayName.trim()) return;

    try {
      setIsSubmittingBirthday(true);
      const birthDateString = `${birthdayMonth}-${birthdayDay.padStart(2, '0')}`;
      
      const id = doc(collection(db, 'users', user.uid, 'birthdays')).id;
      await setDoc(doc(db, 'users', user.uid, 'birthdays', id), {
        id,
        name: birthdayName,
        birthDate: birthDateString,
        createdAt: new Date().toISOString()
      });
      
      setBirthdayName('');
      setBirthdayMonth('01');
      setBirthdayDay('01');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'birthdays');
    } finally {
      setIsSubmittingBirthday(false);
    }
  };

  const handleEditBirthday = (birthday: any) => {
    setEditingBirthdayData(birthday);
  };

  const handleDeleteBirthday = (id: string) => {
    setConfirmation({
      type: 'delete-birthday',
      isOpen: true,
      data: id
    });
  };

  const confirmDeleteNote = async () => {
    if (!user || !confirmation?.data) return;
    const id = confirmation.data;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notes', id));
      if (activeNoteId === id) {
        setActivePage('notes');
        setActiveNoteId(null);
        setNoteEditDraft(null);
      }
      setConfirmation(null);
    } catch (err) {
      console.error("Error deleting note:", err);
    }
  };

  const confirmDeleteBirthday = async () => {
    if (!user || !confirmation?.data) return;
    const id = confirmation.data;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'birthdays', id));
      setConfirmation(null);
    } catch (err) {
      console.error("Error deleting birthday:", err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsMenuOpen(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const batch = writeBatch(db);

      // Delete tasks
      const tasksSnapshot = await getDocs(collection(db, 'users', user.uid, 'tasks'));
      tasksSnapshot.forEach(doc => batch.delete(doc.ref));

      // Delete habits
      const habitsSnapshot = await getDocs(collection(db, 'users', user.uid, 'habits'));
      habitsSnapshot.forEach(doc => batch.delete(doc.ref));

      // Delete lists
      const listsSnapshot = await getDocs(collection(db, 'users', user.uid, 'lists'));
      listsSnapshot.forEach(doc => batch.delete(doc.ref));

      // Delete notes
      const notesSnapshot = await getDocs(collection(db, 'users', user.uid, 'notes'));
      notesSnapshot.forEach(doc => batch.delete(doc.ref));

      // Delete birthdays
      const birthdaysSnapshot = await getDocs(collection(db, 'users', user.uid, 'birthdays'));
      birthdaysSnapshot.forEach(doc => batch.delete(doc.ref));

      // Delete user document
      batch.delete(doc(db, 'users', user.uid));

      await batch.commit();
      
      // Finally delete the auth user
      await deleteUser(user);
      setIsMenuOpen(false);
    } catch (error: any) {
      console.error("Error deleting account:", error);
      if (error.code === 'auth/requires-recent-login') {
        alert("For security reasons, you need to log in again before deleting your account.");
        await signOut(auth);
      } else {
        alert("An error occurred while deleting your account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const batch = writeBatch(db);

      // Delete tasks
      const tasksSnapshot = await getDocs(collection(db, 'users', user.uid, 'tasks'));
      tasksSnapshot.forEach(doc => batch.delete(doc.ref));

      // Delete habits
      const habitsSnapshot = await getDocs(collection(db, 'users', user.uid, 'habits'));
      habitsSnapshot.forEach(doc => batch.delete(doc.ref));

      // Delete lists
      const listsSnapshot = await getDocs(collection(db, 'users', user.uid, 'lists'));
      listsSnapshot.forEach(doc => batch.delete(doc.ref));

      // Delete notes
      const notesSnapshot = await getDocs(collection(db, 'users', user.uid, 'notes'));
      notesSnapshot.forEach(doc => batch.delete(doc.ref));

      // Delete birthdays
      const birthdaysSnapshot = await getDocs(collection(db, 'users', user.uid, 'birthdays'));
      birthdaysSnapshot.forEach(doc => batch.delete(doc.ref));

      await batch.commit();
      setIsMenuOpen(false);
      setConfirmation(null);
    } catch (error: any) {
      console.error("Error resetting data:", error);
      alert("An error occurred while resetting your data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-gray-900 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={() => {}} />;
  }

  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr + 'T00:00:00'), 'dd MMM yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  const computeScheduleForDate = (dateStr: string) => {
    const timeToMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const minutesToTime = (mins: number) => {
      const totalMins = ((mins % 1440) + 1440) % 1440;
      const h = Math.floor(totalMins / 60).toString().padStart(2, '0');
      const m = (totalMins % 60).toString().padStart(2, '0');
      return `${h}:${m}`;
    };

    const dateObj = new Date(dateStr + 'T00:00:00');
    const prevDate = addDays(dateObj, -1);
    const prevDateStr = format(prevDate, 'yyyy-MM-dd');

    const getItemsForDate = (dStr: string, isYesterday: boolean) => {
      const dObj = new Date(dStr + 'T00:00:00');
      const dOfWeekFull = format(dObj, 'EEEE').toLowerCase();
      const dOfWeekShort = format(dObj, 'EEE').toLowerCase();
      const dOfMonth = format(dObj, 'd');

      const dayTasks = (state.tasks || []).filter(t => t.date === dStr && (t.start_time || t.due_time));
      const dayHabits = (state.habits || []).filter(h => {
        const habitData = (h.overrides && h.overrides[dStr]) ? { ...h, ...h.overrides[dStr] } : h;
        if (!habitData.start_time && !habitData.preferred_time) return false;
        if (habitData.start_date && dStr < habitData.start_date) return false;
        if (h.skipped_dates && h.skipped_dates.includes(dStr)) return false;
        if (habitData.frequency_type === 'daily') return true;
        if (habitData.frequency_type === 'weekly') {
          const details = habitData.frequency_detail;
          return Array.isArray(details) && details.some((d: string) => 
            d.toLowerCase() === dOfWeekFull || d.toLowerCase() === dOfWeekShort
          );
        }
        if (habitData.frequency_type === 'monthly') {
          const details = habitData.frequency_detail;
          return Array.isArray(details) && details.includes(dOfMonth);
        }
        return false;
      }).map(h => (h.overrides && h.overrides[dStr]) ? { ...h, ...h.overrides[dStr] } : h);

      const offset = isYesterday ? -1440 : 0;

      return [
        ...dayTasks.map(t => ({ 
          ...t, 
          type: 'task', 
          startMins: timeToMinutes(t.start_time || t.due_time) + offset, 
          duration: Number(t.estimated_duration_minutes) || 30,
          isDone: t.completed,
          effectiveDate: dStr
        })),
        ...dayHabits.map(h => ({ 
          ...h, 
          type: 'habit', 
          startMins: timeToMinutes(h.start_time || h.preferred_time) + offset, 
          duration: Number(h.estimated_duration_minutes) || 30,
          isDone: h.completed_dates?.includes(dStr),
          effectiveDate: dStr
        }))
      ];
    };

    const allItems = [
      ...getItemsForDate(dateStr, false),
      ...getItemsForDate(prevDateStr, true)
    ];

    // Filter items that actually overlap with the current day (0 to 1440)
    const items = allItems.filter(item => {
      const endMins = item.startMins + item.duration;
      return endMins > 0 && item.startMins < 1440;
    });

    items.sort((a, b) => a.startMins - b.startMins);

    const schedule = [];
    let currentMinutes = 0;

    items.forEach((item, index) => {
      const itemEndMins = item.startMins + item.duration;
      const displayStartMins = Math.max(0, item.startMins);

      if (displayStartMins > currentMinutes) {
        schedule.push({
          id: `free-${currentMinutes}-${displayStartMins}`,
          start_time: minutesToTime(currentMinutes),
          end_time: minutesToTime(displayStartMins),
          label: 'Free Time',
          category: 'free_time'
        });
      }

      schedule.push({
        id: item.id + '-' + index,
        start_time: minutesToTime(item.startMins),
        end_time: minutesToTime(itemEndMins),
        label: item.title,
        category: item.type,
        effectiveDate: item.effectiveDate,
        originalData: item,
        originalType: item.type
      });

      currentMinutes = Math.max(currentMinutes, itemEndMins);
    });

    const endOfDayMins = 1440;
    if (currentMinutes < endOfDayMins) {
      schedule.push({
        id: `free-${currentMinutes}-end`,
        start_time: minutesToTime(currentMinutes),
        end_time: minutesToTime(endOfDayMins),
        label: 'Free Time',
        category: 'free_time'
      });
    }

    return schedule;
  };

  const renderFullCalendar = () => {
    const startMonth = startOfMonth(selectedDate);
    const endMonth = endOfMonth(selectedDate);
    const startDate = startOfWeek(startMonth, { weekStartsOn: 1 });
    const endDate = endOfWeek(endMonth, { weekStartsOn: 1 });
    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

    const WEEKDAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 sticky top-0 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold dark:text-white">{format(selectedDate, 'MMMM yyyy')}</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setSelectedDate(addDays(selectedDate, -30))}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </button>
            <button 
              onClick={() => setSelectedDate(addDays(selectedDate, 30))}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS_SHORT.map(day => (
            <div key={day} className="text-center text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center rounded-2xl text-sm transition-all relative group cursor-pointer",
                  isSelected 
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-lg" 
                    : isToday 
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-800"
                      : isCurrentMonth 
                        ? "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium" 
                        : "text-slate-300 dark:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                {day.getDate()}
                {/* Visual indicator for tasks/habits could go here */}
                {!isSelected && ((state.tasks || []).some(t => t.date === format(day, 'yyyy-MM-dd')) || (state.habits || []).length > 0) && (
                   <div className={cn("w-1 h-1 rounded-full mt-0.5", isToday ? "bg-blue-400" : "bg-slate-300 dark:bg-slate-600")} />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selected Day</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{format(selectedDate, 'EEEE, do MMMM')}</p>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderDateSelector = () => {
    return (
      <div className="flex items-center bg-slate-50 shrink-0 px-2 relative z-10 pt-2 pb-1 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] lg:hidden">
        <button onClick={() => scrollCalendar('left')} className="p-2 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div ref={scrollContainerRef} className="flex-1 flex items-center overflow-x-auto gap-2 py-2 no-scrollbar">
          {days.map(d => {
            const isSelected = isSameDay(d, selectedDate);
            const isToday = isSameDay(d, new Date());
            return (
              <button
                key={d.toISOString()}
                ref={(isMobile ? isToday : isSelected) ? selectedDateRef : null}
                onClick={() => setSelectedDate(d)}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[3.25rem] p-3 rounded-[1.25rem] transition-all cursor-pointer border border-transparent",
                  isSelected 
                    ? "bg-black text-white shadow-[0_8px_16px_-6px_rgba(0,0,0,0.4)]" 
                    : "hover:bg-slate-200/50 text-slate-500 hover:text-slate-900",
                  isToday && !isSelected && "text-blue-600 font-bold border-blue-100 bg-blue-50/50"
                )}
              >
                <span className={cn("text-[10px] uppercase tracking-wider font-bold mb-0.5", isSelected ? "opacity-90" : "opacity-60")}>{format(d, 'MMM')}</span>
                <span className={cn("text-xl leading-none", isSelected ? "font-bold" : "font-semibold")}>{format(d, 'd')}</span>
                <span className={cn("text-[10px] uppercase font-bold mt-1 tracking-widest", isSelected ? "opacity-90" : "opacity-50")}>{format(d, 'EEE')}</span>
              </button>
            );
          })}
        </div>
        <button onClick={() => scrollCalendar('right')} className="p-2 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderSchedule = () => {
    if (!user) return null;
    const currentSchedule = computeScheduleForDate(selectedDateStr);

    const targetDayMonth = format(selectedDate, 'MM-dd');
    const todaysBirthdays = (state.birthdays || []).filter(b => {
      if (b.birthDate && b.birthDate?.length === 5) {
        return b.birthDate === targetDayMonth;
      }
      if (b.birthDate && b.birthDate?.length === 10) {
        return b.birthDate.substring(5) === targetDayMonth;
      }
      return false;
    }) || [];

    const getBirthdayMessage = () => {
      if (todaysBirthdays.length === 0) return '';
      const names = todaysBirthdays.map(b => b.name);
      if (names.length === 1) return `It's ${names[0]}'s birthday today! 🎂`;
      if (names.length === 2) return `It's ${names[0]} & ${names[1]}'s birthday today! 🎂`;
      
      const last = names.pop();
      return `It's ${names.join(', ')} & ${last}'s birthdays today! 🎂`;
    };

    if (currentSchedule.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
          <Calendar className="w-12 h-12 opacity-20" />
          <p className="font-medium">No schedule generated for this day.</p>
        </div>
      );
    }

    return (
        <div className="space-y-3 pb-40">
          {todaysBirthdays.length > 0 && (
            <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/50 p-5 rounded-2xl flex items-center gap-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-700 shadow-sm shadow-pink-500/5">
               <div className="w-12 h-12 bg-pink-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-pink-500/20">
                 <Cake className="w-7 h-7" />
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-bold text-pink-900 dark:text-pink-200 uppercase tracking-wider">Birthday Celebration!</p>
                 <p className="text-pink-700 dark:text-pink-300 font-bold text-lg leading-tight">
                   {getBirthdayMessage()}
                 </p>
               </div>
            </div>
          )}
          {currentSchedule.map((block) => {
            const isSelected = block.originalData && selectedIds.has(`${block.originalData.id}:${block.effectiveDate}`);
            const isDone = block.originalData && (
              block.category === 'task' ? block.originalData.completed : 
              block.originalData.completed_dates?.includes(block.effectiveDate)
            );

            const habitColorName = block.category === 'habit' ? (block.originalData.color || userSettings.defaultHabitColor || 'emerald') : 'blue';
            const colorConfig = HABIT_COLORS.find(c => c.name === habitColorName) || HABIT_COLORS[0];

            return (
              <ScheduleTimelineItem
                key={block.id}
                block={{ ...block, title: block.label }}
                isSelected={!!isSelected}
                isDone={!!isDone}
                colorConfig={colorConfig}
                onToggleSelection={toggleSelection}
                onEdit={(type, data) => handleEditClick(type, data, 'schedule')}
                onDelete={(type, id) => handleDelete(type, id, 'schedule')}
              />
            );
          })}
        </div>
    );
  };

  const handleDeleteCompletedTasks = async () => {
    if (!user) return;
    const completedTasks = (state.tasks || []).filter(t => t.completed);
    if (completedTasks.length === 0) return;
    
    try {
      const batch = writeBatch(db);
      completedTasks.forEach(task => {
        batch.delete(doc(db, 'users', user.uid, 'tasks', task.id));
      });
      await batch.commit();
      setMessages(prev => [...prev, { role: 'assistant', text: `Successfully deleted ${completedTasks.length} completed tasks.` }]);
      setShowToast(true);
    } catch (error) {
      console.error("Error deleting completed tasks:", error);
    }
  };

  const getUnfinishedItems = () => {
    if (!user) return [];
    const today = startOfToday();
    const todayStr = format(today, 'yyyy-MM-dd');
    const lookbackDays = 7;
    const unfinishedItems: any[] = [];
    
    // Past unfinished tasks
    state.tasks.forEach(t => {
      if (!t.completed && t.date < todayStr) {
        unfinishedItems.push({ ...t, type: 'task' });
      }
    });

    // Past unfinished habits (last 7 days)
    state.habits.forEach(h => {
      for (let i = 1; i <= lookbackDays; i++) {
        const pastDate = addDays(today, -i);
        const dStr = format(pastDate, 'yyyy-MM-dd');
        
        const habitData = (h.overrides && h.overrides[dStr]) ? { ...h, ...h.overrides[dStr] } : h;
        if (habitData.start_date && dStr < habitData.start_date) continue;
        if (h.skipped_dates && h.skipped_dates.includes(dStr)) continue;
        if (h.completed_dates && h.completed_dates.includes(dStr)) continue;
        
        const dOfWeekFull = format(pastDate, 'EEEE').toLowerCase();
        const dOfWeekShort = format(pastDate, 'eee').toLowerCase();
        const dOfMonth = format(pastDate, 'd');
        
        let occursOnDay = false;
        if (habitData.frequency_type === 'daily') occursOnDay = true;
        else if (habitData.frequency_type === 'weekly') {
          const details = habitData.frequency_detail;
          occursOnDay = Array.isArray(details) && details.some((d: string) => 
            d.toLowerCase() === dOfWeekFull || d.toLowerCase() === dOfWeekShort
          );
        } else if (habitData.frequency_type === 'monthly') {
          const details = habitData.frequency_detail;
          occursOnDay = Array.isArray(details) && details.includes(dOfMonth);
        }
        
        if (occursOnDay) {
          unfinishedItems.push({ 
            ...h, 
            type: 'habit', 
            date: dStr,
            id: `${h.id}:${dStr}` // Unique ID for the viewport
          });
        }
      }
    });
    
    return unfinishedItems.sort((a, b) => b.date.localeCompare(a.date));
  };

  const handleHabitDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id && over) {
      const oldIndex = state.habits.findIndex((h) => h.id === active.id);
      const newIndex = state.habits.findIndex((h) => h.id === over.id);
      
      const newHabits = arrayMove(state.habits, oldIndex, newIndex);
      
      // Update local state immediately for snappy UI
      setState(prev => ({ ...prev, habits: newHabits }));
      
      // Update Firestore in background
      if (user) {
        try {
          const batch = writeBatch(db);
          newHabits.forEach((habit, index) => {
            const habitRef = doc(db, 'users', user.uid, 'habits', habit.id);
            batch.update(habitRef, { order: index });
          });
          await batch.commit();
        } catch (error) {
          console.error("Error saving habit order:", error);
        }
      }
    }
  };

  const handleThemeChange = async (theme: 'light' | 'dark') => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 'settings.theme': theme });
      setUserSettings(prev => ({ ...prev, theme }));
    } catch (error) {
      console.error("Error updating theme:", error);
    }
  };

  const handleUpdateListItems = async (listId: string, items: any[]) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'lists', listId), { items });
    } catch (err) {
      console.error("Error updating list items:", err);
    }
  };

  const renderBirthdays = () => {
    const months = [
      { v: '01', l: 'January' }, { v: '02', l: 'February' }, { v: '03', l: 'March' },
      { v: '04', l: 'April' }, { v: '05', l: 'May' }, { v: '06', l: 'June' },
      { v: '07', l: 'July' }, { v: '08', l: 'August' }, { v: '09', l: 'September' },
      { v: '10', l: 'October' }, { v: '11', l: 'November' }, { v: '12', l: 'December' }
    ];
    
    // Generate days 01-31
    const daysArr = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

    const sortedBirthdays = [...(state.birthdays || [])].sort((a, b) => {
      const getSortVal = (dateStr: string) => {
        if (!dateStr || dateStr.length === 5) return dateStr || ''; // MM-DD
        return dateStr.substring(5); // YYYY-MM-DD -> MM-DD
      };
      return getSortVal(a.birthDate).localeCompare(getSortVal(b.birthDate));
    });

    return (
      <div className="space-y-8 pb-40 fade-in">
        {/* Add Birthday Form */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            Add New Birthday
          </h3>
          <form onSubmit={handleSaveBirthday} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Person's Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={birthdayName}
                  onChange={(e) => setBirthdayName(e.target.value)}
                  placeholder="e.g. John Doe" 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                  required
                />
              </div>
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="flex-1 sm:w-36 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Month</label>
                <select 
                  value={birthdayMonth}
                  onChange={(e) => setBirthdayMonth(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium cursor-pointer"
                >
                  {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                </select>
              </div>
              <div className="flex-1 sm:w-24 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Day</label>
                <select 
                  value={birthdayDay}
                  onChange={(e) => setBirthdayDay(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium cursor-pointer"
                >
                  {daysArr.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                type="submit"
                disabled={isSubmittingBirthday}
                className="flex-1 sm:px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm shadow-lg hover:shadow-indigo-500/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingBirthday ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </div>
          </form>
        </div>

        {/* Birthdays List View */}
        <div className="space-y-3">
          {sortedBirthdays.length === 0 ? (
            <div className="w-full py-12 text-center text-slate-400 font-medium bg-white/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              No birthdays recorded yet.
            </div>
          ) : (
            sortedBirthdays.map(b => (
              <BirthdayItem 
                key={b.id} 
                birthday={b} 
                onEdit={handleEditBirthday}
                onDelete={handleDeleteBirthday} 
              />
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden">
      <SideNav
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={user}
        activePage={activePage}
        onPageSelect={setActivePage}
        onLogout={handleLogout}
      />
      <div className="flex-1 h-[100dvh] bg-white dark:bg-slate-950 overflow-hidden flex flex-col relative transition-colors duration-300">
        
        {/* Header */}
        <header className="px-6 pt-12 lg:pt-8 pb-4 shrink-0 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 z-10 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-slate-900 dark:hover:text-white dark:text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight truncate flex items-center gap-2">
                <span className="text-slate-900 dark:text-white font-bold">
                  {activePage === 'note-detail' ? 'Note detail' : activePage.charAt(0).toUpperCase() + activePage.slice(1)}
                  {activePage === 'lists' && activeListId && state.lists?.find(l => l.id === activeListId) && (
                    <>
                      <span className="text-slate-400 dark:text-slate-500 font-medium mx-2">/</span>
                      <span className="text-slate-900 dark:text-white font-bold">{(state.lists || []).find(l => l.id === activeListId)?.title}</span>
                    </>
                  )}
                </span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchData(user.uid)}
              disabled={isRefetching}
              className={cn("w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-colors shrink-0", isRefetching ? "opacity-50 cursor-not-allowed" : "cursor-pointer")}
              title="Refresh Data"
            >
              <RotateCcw className={cn("w-4 h-4", isRefetching && "animate-spin text-slate-900 dark:text-white")} />
            </button>
          </div>
        </header>

        {activePage === 'schedule' && renderDateSelector()}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth relative">
          {activePage === 'schedule' ? (
            <div className="flex flex-col lg:flex-row gap-8 min-h-full">
               <div className="hidden lg:block lg:w-[380px] shrink-0">
                 {renderFullCalendar()}
               </div>
               <div className="flex-1">
                 {renderSchedule()}
               </div>
            </div>
          ) : (
            <>
              {activePage === 'tasks' && <TasksView
                tasks={state.tasks}
                selectedIds={selectedIds}
                toggleSelection={toggleSelection}
                handleEditClick={handleEditClick}
                handleDelete={handleDelete}
                handleDeleteCompletedTasks={handleDeleteCompletedTasks}
                handleAddNewItem={handleAddNewItem}
              />}
              {activePage === 'habits' && <HabitsView
                habits={state.habits}
                selectedIds={selectedIds}
                userSettings={userSettings}
                handleHabitDragEnd={handleHabitDragEnd}
                toggleSelection={toggleSelection}
                handleEditClick={handleEditClick}
                handleDelete={handleDelete}
                handleAddNewItem={handleAddNewItem}
              />}
              {activePage === 'unfinished' && <UnfinishedView
                unfinished={getUnfinishedItems()}
                selectedIds={selectedIds}
                toggleSelection={toggleSelection}
                handleEditClick={handleEditClick}
                handleDelete={handleDelete}
              />}

              {activePage === 'lists' && <ListsView
                lists={state.lists}
                activeListId={activeListId}
                setActiveListId={setActiveListId}
                handleUpdateListItems={handleUpdateListItems}
                handleEditClick={handleEditClick}
                handleDelete={handleDelete}
                setEditingListItem={setEditingListItem}
                setNewListItemTitle={setNewListItemTitle}
                listInput={listInput}
                setListInput={setListInput}
                handleAddNewItem={handleAddNewItem}
              />}
              {activePage === 'notes' && <NotesView
                notes={state.notes}
                handleCreateNote={handleCreateNote}
                setActiveNoteId={setActiveNoteId}
                setNoteEditorMode={setNoteEditorMode as any}
                setActivePage={setActivePage}
                handleDeleteNote={handleDeleteNote}
              />}
              {activePage === 'note-detail' && <NoteDetailView
                activeNoteId={activeNoteId}
                notes={state.notes}
                setActivePage={setActivePage}
                noteEditDraft={noteEditDraft}
                setNoteEditDraft={setNoteEditDraft}
                handleSaveNote={handleSaveNote}
                isSavingNote={isSavingNote}
                setIsSavingNote={setIsSavingNote}
                handleDeleteNote={handleDeleteNote}
              />}
              {activePage === 'birthdays' && <BirthdaysView
                birthdays={state.birthdays}
                handleSaveBirthday={handleSaveBirthday}
                birthdayName={birthdayName}
                setBirthdayName={setBirthdayName}
                birthdayMonth={birthdayMonth}
                setBirthdayMonth={setBirthdayMonth}
                birthdayDay={birthdayDay}
                setBirthdayDay={setBirthdayDay}
                isSubmittingBirthday={isSubmittingBirthday}
                handleEditBirthday={setEditingBirthdayData}
                handleDeleteBirthday={handleDeleteBirthday}
              />}
              {activePage === 'settings' && <SettingsView
                state={state}
                fetchData={fetchData}
                user={user}
                setUser={setUser as any}
                userSettings={userSettings}
                handleThemeChange={handleThemeChange as any}
                setConfirmation={setConfirmation}
                setMessages={setMessages}
                setShowToast={setShowToast}
              />}
              {activePage === 'about' && <AboutView />}
              {activePage === 'docs' && <DocsView />}
            </>
          )}
          <div ref={messagesEndRef} />
        </main>

        <ConfirmationModal 
          isOpen={confirmation?.isOpen && confirmation?.type === 'delete-account'}
          onClose={() => setConfirmation(null)}
          onConfirm={handleDeleteAccount}
          title="Delete Account"
          message="Are you sure you want to delete your account? This will permanently delete all your tasks, habits, and profile data. This action cannot be undone."
          confirmText="Delete Account"
        />
        <ConfirmationModal 
          isOpen={confirmation?.isOpen && confirmation?.type === 'reset-data'}
          onClose={() => setConfirmation(null)}
          onConfirm={handleResetData}
          title="Reset All Data"
          message="Are you sure you want to reset your data? This will delete all your tasks and habits, but keep your account. This action cannot be undone."
          confirmText="Reset Now"
        />
        <ConfirmationModal 
          isOpen={confirmation?.isOpen && confirmation?.type === 'delete-habit'}
          onClose={() => setConfirmation(null)}
          onConfirm={confirmDeleteHabit}
          title="Delete Habit"
          message="Are you sure you want to delete this habit? This will remove all future occurrences of this habit. This action cannot be undone."
          confirmText="Delete Habit"
        />
        <ConfirmationModal 
          isOpen={confirmation?.isOpen && confirmation?.type === 'delete-task'}
          onClose={() => setConfirmation(null)}
          onConfirm={confirmDeleteTask}
          title="Delete Task"
          message="Are you sure you want to delete this task? This action cannot be undone."
          confirmText="Delete Task"
        />
        <ConfirmationModal 
          isOpen={confirmation?.isOpen && confirmation?.type === 'delete-note'}
          onClose={() => setConfirmation(null)}
          onConfirm={confirmDeleteNote}
          title="Delete Note"
          message="Are you sure you want to delete this note? This action cannot be undone."
          confirmText="Delete Note"
        />
        <ConfirmationModal 
          isOpen={confirmation?.isOpen && confirmation?.type === 'delete-birthday'}
          onClose={() => setConfirmation(null)}
          onConfirm={confirmDeleteBirthday}
          title="Delete Birthday"
          message="Are you sure you want to delete this birthday reminder? This action cannot be undone."
          confirmText="Delete Birthday"
        />
        <ConfirmationModal 
          isOpen={confirmation?.isOpen && confirmation?.type === 'delete-list'}
          onClose={() => setConfirmation(null)}
          onConfirm={confirmDeleteList}
          title="Delete List"
          message="Are you sure you want to delete this list? All sub-items will be removed. This action cannot be undone."
          confirmText="Delete List"
        />

        {/* Edit List Item Modal */}
        {editingListItem && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingListItem(null)} />
            <div className="relative bg-white dark:bg-slate-800 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Edit Item</h3>
                <button onClick={() => setEditingListItem(null)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700/50 rounded-full transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Item Text</label>
                  <input 
                    value={newListItemTitle}
                    onChange={(e) => setNewListItemTitle(e.target.value)}
                    autoFocus
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all text-slate-900 dark:text-slate-100 font-medium font-sans outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveListItemEdit()}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setEditingListItem(null)} className="flex-1 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                  <button onClick={handleSaveListItemEdit} className="flex-1 py-3.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold cursor-pointer hover:bg-slate-800 dark:hover:bg-slate-200 shadow-md transition-all">Save</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions Overlay */}
        {(() => {
          if (selectedIds.size === 0) return null;
          
          const selectedItems = Array.from(selectedIds).map((key: string) => {
            const [id, date] = key.split(':');
            const task = (state.tasks || []).find(t => t.id === id);
            const habit = (state.habits || []).find(h => h.id === id);
            const isDone = task ? task.completed : (habit ? habit.completed_dates?.includes(date || selectedDateStr) : false);
            const isTask = !!task;
            return { id, isDone, isTask };
          });
          
          const allDone = selectedItems.every(item => item.isDone);
          const allUndone = selectedItems.every(item => !item.isDone);
          const hasMixed = !allDone && !allUndone;
          const canDelete = selectedIds.size > 0;

          return (
            <BulkActions
              selectedCount={selectedIds.size}
              allDone={allDone}
              allUndone={allUndone}
              hasMixed={hasMixed}
              canDelete={canDelete}
              onDeselectAll={() => setSelectedIds(new Set())}
              onMarkDone={handleMarkDone}
              onRestore={handleRestore}
              onDelete={handleBulkDelete}
            />
          );
        })()}

        {/* Global Toast / Latest Message Bubble */}
        {showToast && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
          <div className={cn(
            "fixed z-50 pointer-events-auto flex items-end drop-shadow-lg", 
            activePage === 'settings' ? "bottom-6 left-4 sm:left-6" : "bottom-24 sm:bottom-28 left-4 sm:left-8 max-w-[calc(100vw-80px)] sm:max-w-md"
          )}>
            <div className="bg-slate-900 dark:bg-slate-800 text-white px-5 py-3.5 rounded-[1.25rem] rounded-bl-sm text-sm inline-block shadow-lg border border-slate-700/50 pr-10 font-medium animate-in slide-in-from-bottom-5">
              {messages[messages.length - 1].text}
              <button 
                type="button" 
                onClick={() => setShowToast(false)} 
                className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Chat / Input Area */}
        {activePage !== 'settings' && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white dark:from-slate-950 dark:via-slate-950 to-transparent pt-16 pb-6 px-4 sm:px-8 z-20 pointer-events-none">
            <div className="flex flex-col gap-2 pointer-events-auto max-w-4xl mx-auto">
              <div className="flex items-end gap-3 sm:gap-4">
                <form onSubmit={handleSubmit} className="flex-1 relative flex items-end shadow-lg hover:shadow-xl transition-shadow rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (input.trim() && !isLoading) {
                          handleSubmit(e as any);
                        }
                      }
                    }}
                    style={{ overflowY: textareaRef.current && textareaRef.current.scrollHeight > 110 ? 'auto' : 'hidden' }}
                    placeholder="e.g. Gym for 1h, Study at 2pm..."
                    className="flex-1 bg-transparent py-4 pl-6 pr-14 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium resize-none min-h-[56px] max-h-[120px]"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 bottom-2 w-10 h-10 flex items-center justify-center bg-indigo-600 outline-none text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors cursor-pointer shadow-md"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                  </button>
                </form>
                <button
                  onClick={() => setIsAddMenuOpen(true)}
                  className="w-14 h-14 shrink-0 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-800 dark:hover:bg-slate-100 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer border border-transparent dark:border-slate-200"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
              <div className="flex justify-start px-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1 bg-slate-100 dark:bg-slate-800/60 rounded-full inline-flex items-center gap-1.5 border border-slate-200/50 dark:border-slate-700/50">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  {10 - (userSettings.aiUsage?.date === format(new Date(), 'yyyy-MM-dd') ? (userSettings.aiUsage?.count || 0) : 0)} AI inputs left today
                </span>
              </div>
            </div>
          </div>
        )}

        {isAddMenuOpen && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddMenuOpen(false)} />
            <div className="relative bg-white w-full sm:max-w-sm sm:rounded-[2rem] rounded-t-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-200">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Add New</h3>
                <button onClick={() => setIsAddMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={() => handleAddNewItem('task')} className="flex items-center gap-4 p-4 rounded-[1.25rem] bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900">Task</div>
                    <div className="text-sm text-slate-500 font-medium">One-time activity</div>
                  </div>
                </button>
                <button onClick={() => handleAddNewItem('habit')} className="flex items-center gap-4 p-4 rounded-[1.25rem] bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Repeat className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900">Habit</div>
                    <div className="text-sm text-slate-500 font-medium">Recurring activity</div>
                  </div>
                </button>
                <button onClick={() => handleAddNewItem('list')} className="flex items-center gap-4 p-4 rounded-[1.25rem] bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900">List</div>
                    <div className="text-sm text-slate-500 font-medium">Simple checklist</div>
                  </div>
                </button>
                <button onClick={() => handleAddNewItem('note')} className="flex items-center gap-4 p-4 rounded-[1.25rem] bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900">Note</div>
                    <div className="text-sm text-slate-500 font-medium">Rich text document</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {editingItem && (
          <EditModal 
            item={editingItem} 
            onSave={handleSaveEdit} 
            onClose={() => setEditingItem(null)} 
            habitColors={HABIT_COLORS}
            defaultHabitColor={userSettings.defaultHabitColor}
          />
        )}

        {editingBirthdayData && (
          <EditBirthdayModal
            birthday={editingBirthdayData}
            onClose={() => setEditingBirthdayData(null)}
            onSave={handleSaveBirthdayEdit}
          />
        )}
      </div>
    </div>
  );
}
