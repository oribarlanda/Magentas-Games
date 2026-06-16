"use client";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-40 bg-brand-bg/95 backdrop-blur border-b border-brand-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center text-white text-base">🎮</div>
            <span className="font-bold text-brand-text text-sm">משחקי יום הגיבוש</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/" className="px-3 py-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-surface text-sm transition-colors">בית</Link>
            <button onClick={() => setShowHelp(true)} className="px-3 py-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-surface text-sm transition-colors">הוראות</button>
          </div>
        </div>
      </header>

      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-brand-surface rounded-2xl p-6 max-w-sm w-full border border-brand-border animate-bounce-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-brand-text mb-4">הוראות</h2>
            <ul className="space-y-3 text-brand-muted text-sm">
              <li className="flex gap-2"><span>🔗</span><span><strong className="text-brand-text">מה הקשר</strong> – בחרו 4 מילים עם קשר משותף</span></li>
              <li className="flex gap-2"><span>🧠</span><span><strong className="text-brand-text">הגיונית</strong> – ענו על חידה לוגית</span></li>
              <li className="flex gap-2"><span>⛓️</span><span><strong className="text-brand-text">השרשרת</strong> – חברו מילת התחלה לסוף</span></li>
              <li className="flex gap-2"><span>🎵</span><span><strong className="text-brand-text">איזה שיר</strong> – נחשו שם שיר לפי תיאורים</span></li>
              <li className="flex gap-2"><span>🕵️</span><span><strong className="text-brand-text">מי אני</strong> – גלו מי הדמות לפי רמזים</span></li>
            </ul>
            <p className="mt-4 text-xs text-brand-muted">פחות רמזים = יותר נקודות. הניקוד נשמר אוטומטית.</p>
            <button onClick={() => setShowHelp(false)} className="mt-5 w-full py-2.5 bg-brand-accent hover:bg-brand-accentHover text-white rounded-xl font-medium transition-colors">בואו נשחק!</button>
          </div>
        </div>
      )}
    </>
  );
}
