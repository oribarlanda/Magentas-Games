import type { GameInfo } from "@/types";

export const GAMES: GameInfo[] = [
  {
    id: "connections",
    title: "מה הקשר",
    description: "16 מילים, 4 קבוצות נסתרות. מצאו את הקשר המשותף.",
    icon: "🔗",
    path: "/connections",
  },
  {
    id: "logic",
    title: "הגיונית",
    description: "חידה לוגית אחת. פשוטה להבנה, קשה לפתרון.",
    icon: "🧠",
    path: "/logic",
  },
  {
    id: "chain",
    title: "השרשרת",
    description: "חברו בין שתי מילים דרך שרשרת של מושגים.",
    icon: "⛓️",
    path: "/chain",
  },
  {
    id: "which-song",
    title: "איזה שיר",
    description: "זיהוי שיר לפי תיאור ורמזים בלבד.",
    icon: "🎵",
    path: "/which-song",
  },
  {
    id: "who-am-i",
    title: "מי אני",
    description: "רמזים בהדרגה. פחות רמזים = יותר נקודות.",
    icon: "🕵️",
    path: "/who-am-i",
  },
];
