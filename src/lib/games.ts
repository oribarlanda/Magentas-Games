import type { GameInfo } from "@/types";

export const GAMES: GameInfo[] = [
  {
    id: "connections",
    title: "מה הקשר",
    description: "20 מילים, 5 קבוצות נסתרות. מצאו את הקשר המשותף.",
    icon: "🔗",
    path: "/connections",
  },
  {
    id: "logic-easy",
    title: "הגיונית – קל",
    description: "חידה לוגית ברמת קושי קלה. חישבו מחוץ לקופסה.",
    icon: "🟢",
    path: "/logic/easy",
  },
  {
    id: "logic-hard",
    title: "הגיונית – קשה",
    description: "חידה לוגית ברמת קושי גבוהה. לא מה שנראה.",
    icon: "🔴",
    path: "/logic/hard",
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
