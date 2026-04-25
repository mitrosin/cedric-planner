import React, { useMemo, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { parseISO, format, eachWeekOfInterval, startOfWeek, endOfWeek, isSameWeek } from 'date-fns';

interface HabitHeatmapProps {
  habit: any;
}

export const HabitHeatmap: React.FC<HabitHeatmapProps> = ({ habit }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const data = useMemo(() => {
    let startDate = new Date();
    if (habit.start_date) {
      try {
        const parsed = parseISO(habit.start_date);
        if (!isNaN(parsed.getTime())) startDate = parsed;
      } catch {}
    } else if (habit.createdAt) {
      try {
        const parsed = parseISO(habit.createdAt);
        if (!isNaN(parsed.getTime())) startDate = parsed;
      } catch {}
    }

    if (habit.completed_dates && habit.completed_dates.length > 0) {
      const firstCompleted = parseISO(habit.completed_dates[0]);
      if (!isNaN(firstCompleted.getTime()) && firstCompleted < startDate) {
        startDate = firstCompleted;
      }
    }

    const today = new Date();
    // In case startDate was resolved in the future (wrong data), constrain it
    if (startDate > today) {
      startDate = today;
    }

    const weeks = eachWeekOfInterval({
      start: startOfWeek(startDate, { weekStartsOn: 1 }),
      end: endOfWeek(today, { weekStartsOn: 1 }),
    }, { weekStartsOn: 1 });

    const completedDates = (habit.completed_dates || []).map((d: string) => {
      try { return parseISO(d); } catch { return null; }
    }).filter(Boolean) as Date[];

    return weeks.map(weekDate => {
      const count = completedDates.filter((cd: Date) => isSameWeek(cd, weekDate, { weekStartsOn: 1 })).length;
      return {
        weekLabel: format(weekDate, 'MMM d'),
        count,
        fullDate: `Week of ${format(weekDate, 'MMM d, yyyy')}`
      };
    });
  }, [habit]);

  // Scroll to the end (most recent weeks) on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [data]);

  if (data.length === 0) return null;

  // Calculate a reasonable minimum width so bars don't get squished
  const chartMinWidth = Math.max(200, data.length * 36);

  return (
    <div className="mt-6 w-full bg-white/50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Completions Over Time</p>
      <div 
        ref={scrollContainerRef}
        className="w-full overflow-x-auto overflow-y-hidden pb-1 -mx-2 px-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div style={{ minWidth: `${chartMinWidth}px`, height: '140px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="weekLabel" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                dy={10}
                interval="preserveStartEnd"
              />
              <Tooltip 
                cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white text-xs font-bold px-2 py-1.5 rounded-lg shadow-xl outline-none z-50">
                        <p>{payload[0].payload.fullDate}</p>
                        <p className="text-slate-300 font-medium">{payload[0].value} completions</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="count" 
                fill="currentColor" 
                radius={[4, 4, 4, 4]} 
                className="text-slate-800 dark:text-slate-200"
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
