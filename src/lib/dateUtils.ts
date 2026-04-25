import { format, parseISO } from 'date-fns';

export const formatDateLabel = (dateStr: string) => {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return format(d, 'd MMM yyyy');
  } catch {
    return dateStr;
  }
};

export const formatDateStr = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), 'd MMM yyyy');
  } catch {
    return dateStr;
  }
};
