import Link from "next/link";
import GamePageWrapper from "@/components/ui/GamePageWrapper";

export default function LogicPage() {
  const levels = [
    {
      title: "הגיונית - קל",
      description: "חידה קלה יותר לפתיחה. אותם כללים, אותה שיטת ניקוד.",
      icon: "🟢",
      href: "/logic/easy",
    },
    {
      title: "הגיונית - קשה",
      description: "חידה מאתגרת יותר למי שרוצה לחשוב עוד צעד קדימה.",
      icon: "🔴",
      href: "/logic/hard",
    },
  ];

  return (
    <GamePageWrapper
      title="הגיונית"
      icon="🧠"
      subtitle="בחרו דרגת קושי. בכל חידה יש משבצת לכל אות ושני רמזים שחושפים אותיות."
    >
      <div className="space-y-3">
        {levels.map((level) => (
          <Link
            key={level.href}
            href={level.href}
            className="flex items-center gap-4 rounded-2xl border border-brand-border bg-brand-surface p-4 transition-all hover:border-brand-accent"
          >
            <div className="shrink-0 text-3xl">{level.icon}</div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-brand-text">{level.title}</h2>
              <p className="text-sm leading-snug text-brand-muted">{level.description}</p>
            </div>
            <div className="shrink-0 text-lg text-brand-muted">›</div>
          </Link>
        ))}
      </div>
    </GamePageWrapper>
  );
}
