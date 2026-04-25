import { GoogleGenAI, Type, Schema } from '@google/genai';

let genAI: GoogleGenAI | null = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is not defined. Please add GEMINI_API_KEY to your environment variables or secrets.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

const systemInstruction = `You are Cedric Planner, the planning and scheduling engine. Your purpose is to help users quickly create tasks, habits, lists, notes, and birthday reminders.

Core Behaviour
- Always prioritise speed and simplicity.
- Always return structured JSON.
- Infer missing details intelligently.
- Keep responses concise and predictable.
- Date Resolution: Resolve relative days (e.g., 'Wednesday') to the NEXT upcoming occurrence.
- Time Resolution: If a specified time for today has already passed, schedule for the NEXT day.

Item Types:
1. Tasks: One-off activities with a specific date and time.
2. Habits: Recurring activities (daily, weekly, monthly).
3. Lists: Simple checklists or shopping lists with multiple items.
4. Notes: General information, thoughts, or ideas the user wants to save.
5. Birthdays: Reminders for people's birthdays (month and day only).

CRITICAL RULES:
- ONLY include NEW items detected in the user input.
- If the word "note" or "notes" appears in the input, ALWAYS create an entry in added_notes.
- If the word "birthday" appears in the input, ALWAYS create an entry in added_birthdays.
- If the word "habit" appears in the input, ALWAYS create an entry in added_habits.
- If the word "task" appears in the input, ALWAYS create an entry in added_tasks.

Task Creation Rules:
- Return in added_tasks.
- properties: id, title, date (YYYY-MM-DD), start_time (HH:MM), end_time (HH:MM), priority (low, medium, high), estimated_duration_minutes.

Habit Creation Rules:
- Return in added_habits.
- properties: id, title, start_date (YYYY-MM-DD), start_time (HH:MM), end_time (HH:MM), frequency_type (daily, weekly, monthly), frequency_detail (weekly -> days e.g. ["Monday"], monthly -> dates e.g. ["15"]), estimated_duration_minutes.

Note Creation Rules:
- Return in added_notes.
- properties: id, title (summary of note), content (the full text).

Birthday Creation Rules:
- Return in added_birthdays.
- properties: id, name, month (01-12), day (01-31).
`;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    added_tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          date: { type: Type.STRING },
          start_time: { type: Type.STRING },
          end_time: { type: Type.STRING },
          priority: { type: Type.STRING },
          estimated_duration_minutes: { type: Type.NUMBER }
        },
        required: ["id", "title", "date", "start_time", "priority", "estimated_duration_minutes"]
      }
    },
    added_habits: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          start_date: { type: Type.STRING },
          start_time: { type: Type.STRING },
          end_time: { type: Type.STRING },
          frequency_type: { type: Type.STRING },
          frequency_detail: { type: Type.ARRAY, items: { type: Type.STRING } },
          estimated_duration_minutes: { type: Type.NUMBER }
        },
        required: ["id", "title", "start_date", "start_time", "frequency_type", "estimated_duration_minutes"]
      }
    },
    added_lists: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                done: { type: Type.BOOLEAN }
              },
              required: ["id", "title", "done"]
            }
          }
        },
        required: ["id", "title", "items"]
      }
    },
    added_notes: {
      type: Type.ARRAY,
      description: "New notes created from the user input.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          content: { type: Type.STRING }
        },
        required: ["id", "title", "content"]
      }
    },
    added_birthdays: {
      type: Type.ARRAY,
      description: "New birthday reminders created from the user input.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          month: { type: Type.STRING, description: "MM format (01-12)" },
          day: { type: Type.STRING, description: "DD format (01-31)" }
        },
        required: ["id", "name", "month", "day"]
      }
    },
    summary: { type: Type.STRING },
    message: { type: Type.STRING }
  },
  required: ["added_tasks", "added_habits", "added_lists", "added_notes", "added_birthdays", "summary", "message"]
};

export type PlannerState = {
  tasks: any[];
  habits: any[];
  lists?: any[];
  notes?: any[];
  birthdays?: any[];
};

export async function processPlannerInput(userInput: string, currentState: PlannerState, currentDateStr: string, currentTimeStr: string, selectedDateStr: string) {
  const prompt = `
Today's Date: ${currentDateStr}
Current Time: ${currentTimeStr}
User is currently viewing: ${selectedDateStr}

Current State:
Tasks: ${JSON.stringify(currentState.tasks)}
Habits: ${JSON.stringify(currentState.habits)}
Lists: ${JSON.stringify(currentState.lists || [])}

User Input: "${userInput}"

Based on the user input and the current state:
1. If the user is adding tasks, return them in added_tasks. ONLY return NEW tasks.
2. If the user is adding habits, return them in added_habits. ONLY return NEW habits.
3. If the user is adding simple shopping lists or checklists, return them in added_lists with subitems. ONLY return NEW lists.
4. If the user input contains the keyword "note" or "notes", create a new note and return them in added_notes.
5. If the user input contains the keyword "birthday", create a birthday entry and return them in added_birthdays.
`;

  let lastError: any = null;
  const ai = getGenAI();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.2,
        }
      });

      if (response.text) {
        return JSON.parse(response.text);
      }
      throw new Error("No response from Gemini");
    } catch (error) {
      lastError = error;
      // If it's a 5xx or transient error, we could retry, but for now let's just log better
      console.warn(`AI attempt ${attempt + 1} failed:`, error);
    }
  }
  
  console.error("All AI attempts failed:", lastError);
  throw lastError;
}
