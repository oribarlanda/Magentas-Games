import Link from "next/link";
import GamePageWrapper from "@/components/ui/GamePageWrapper";

const levels = [
  {
    title: "הגיונית - קל",
    description: "חידה קצרה להתחלה. אותם חוקים, פחות כאב ראש.",
    href: "/logic/easy",
    icon: "🟢",
  },
  {
    title: "הגיונית - קשה",
    description: "חידה מאתגרת יותר למי שרוצה להסתבך קצת.",
    href: "/logic/hard",
    icon: "🔴",
  },
];

export default function LogicPage() {
  return (
    <GamePageWrapper
      title="הגיונית"
      icon="🧠"
      subtitle="בחרו דרגת קושי. העיצוב והחוקים זהים בשתי החידות."
    >
      <div className="space-y-3">
        {levels.map((level) => (
          <Link
            key={level.href}
            href={level.href}
            className="flex items-center gap-4 rounded-2xl border border-brand-border bg-brand-surface p-4 transition-all hover:border-brand-accent"
          >
            <div className="text-3xl shrink-0">{level.icon}</div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-brand-text">{level.title}</h2>
              <p className="text-brand-muted text-sm leading-snug">{level.description}</p>
            </div>
            <div className="text-brand-muted shrink-0 text-lg">›</div>
          </Link>
        ))}
      </div>
    </GamePageWrapper>
  );
}
