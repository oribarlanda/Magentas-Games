"use client";
import { useState, useCallback } from "react";
import type { ChainData } from "@/types";
import { saveScore, calcScore } from "@/lib/storage";
import GameResult from "@/components/ui/GameResult";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function ChainGame({ data }: { data: ChainData }) {
  const answers = data.links.map(l => l.answer);
  const total = answers.length;

  // מילים בצדדים – מעורבבות
  const [pool, setPool] = useState<string[]>(() => shuffle(answers));
  // מה ממוקם בכל חריץ (null = ריק)
  const [slots, setSlots] = useState<(string | null)[]>(Array(total).fill(null));
  // חריצים שנעולים בירוק (נכונים)
  const [locked, setLocked] = useState<boolean[]>(Array(total).fill(false));
  // מילה שנבחרה מה-pool
  const [selected, setSelected] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [won, setWon] = useState(false);

  const norm = (s: string) => s.trim().toLowerCase();

  // לחיצה על מילה מה-pool
  const handlePoolClick = (word: string) => {
    if (finished) return;
    setSelected(prev => prev === word ? null : word);
  };

  // לחיצה על חריץ
  const handleSlotClick = (i: number) => {
    if (finished || locked[i]) return;

    if (selected !== null) {
      // יש מילה נבחרה – שים אותה בחריץ
      const prevInSlot = slots[i];
      const newSlots = [...slots];
      newSlots[i] = selected;
      setSlots(newSlots);

      // הסר מה-pool, והחזר את מה שהיה בחריץ
      setPool(prev => {
        const next = prev.filter(w => w !== selected);
        if (prevInSlot !== null) next.push(prevInSlot);
        return next;
      });
      setSelected(null);
    } else if (slots[i] !== null) {
      // אין מילה נבחרה – החזר את מה שבחריץ ל-pool
      const word = slots[i]!;
      const newSlots = [...slots];
      newSlots[i] = null;
      setSlots(newSlots);
      setPool(prev => [...prev, word]);
    }
  };

  // אישור
  const handleCheck = useCallback(() => {
    if (slots.some((s, i) => !locked[i] && s === null)) return;

    const newLocked = [...locked];
    const newSlots = [...slots];
    const returnToPool: string[] = [];

    slots.forEach((word, i) => {
      if (locked[i]) return;
      if (word !== null && norm(word) === norm(answers[i])) {
        newLocked[i] = true;
      } else if (word !== null) {
        returnToPool.push(word);
        newSlots[i] = null;
      }
    });

    setLocked(newLocked);
    setSlots(newSlots);
    setPool(prev => [...prev, ...returnToPool]);

    if (newLocked.every(Boolean)) {
      const score = calcScore(100, hintsUsed, data.links.length);
      saveScore({ gameId: "chain", score, solved: true, hintsUsed, completedAt: Date.now() });
      window.dispatchEvent(new Event("score-updated"));
      setWon(true);
      setFinished(true);
    }
  }, [slots, locked, answers, hintsUsed, data.links.length]);

  // רמז – ממקם את התשובה הנכונה לחריץ הראשון הלא נעול
  const handleHint = () => {
    const idx = locked.findIndex((l, i) => !l && slots[i] !== answers[i]);
    if (idx === -1) return;

    const correctWord = answers[idx];
    const prevInSlot = slots[idx];
    const newSlots = [...slots];
    newSlots[idx] = correctWord;

    const newLocked = [...locked];
    newLocked[idx] = true;

    setPool(prev => {
      let next = prev.filter(w => w !== correctWord);
      if (prevInSlot !== null && prevInSlot !== correctWord) next.push(prevInSlot);
      return next;
    });
    setSlots(newSlots);
    setLocked(newLocked);
    setHintsUsed(h => h + 1);
    setSelected(null);

    // בדוק ניצחון
    if (newLocked.every(Boolean)) {
      const score = calcScore(100, hintsUsed + 1, data.links.length);
      saveScore({ gameId: "chain", score, solved: true, hintsUsed: hintsUsed + 1, completedAt: Date.now() });
      window.dispatchEvent(new Event("score-updated"));
      setWon(true);
      setFinished(true);
    }
  };

  const allFilled = slots.every((s, i) => locked[i] || s !== null);
  const score = calcScore(100, hintsUsed, data.links.length);
  const shareText = `⛓️ פתרתי את "השרשרת"!\n${data.start} → ... → ${data.end}\nניקוד: ${score}`;

  // מילים בצד שמאל וימין
  const leftPool = pool.filter((_, i) => i % 2 === 0);
  const rightPool = pool.filter((_, i) => i % 2 === 1);

  return (
    <div className="space-y-5">
      {/* לוח השרשרת */}
      <div className="flex gap-2 items-start justify-center">

        {/* עמודה שמאל */}
        <div className="flex flex-col gap-3 flex-1 items-end pt-16">
          {leftPool.map(word => (
            <button key={word} onClick={() => handlePoolClick(word)}
              className={`px-3 py-2 rounded-2xl text-sm font-medium border transition-all
                ${selected === word
                  ? "bg-brand-accent border-brand-accent text-white scale-95"
                  : "bg-brand-surface border-brand-border text-brand-text hover:border-brand-accent"}`}>
              {word}
            </button>
          ))}
        </div>

        {/* עמודת שרשרת מרכזית */}
        <div className="flex flex-col items-center gap-0 shrink-0">
          {/* נקודת התחלה */}
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-white text-sm font-bold text-center leading-tight z-10">
            {data.start}
          </div>

          {data.links.map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              {/* קו מקווקו */}
              <div className="w-px h-3 border-l-2 border-dashed border-brand-border" />

              {/* חריץ */}
              <button
                onClick={() => handleSlotClick(i)}
                className={`
                  w-16 h-16 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all
                  ${locked[i]
                    ? "bg-green-400 border-green-400 text-white"
                    : slots[i]
                    ? "bg-brand-accent border-brand-accent text-white"
                    : selected !== null
                    ? "border-brand-accent border-dashed bg-brand-surface animate-pulse"
                    : "border-dashed border-brand-border bg-brand-surface"}
                `}
              >
                {slots[i] ?? ""}
              </button>
            </div>
          ))}

          {/* קו + נקודת סוף */}
          <div className="w-px h-3 border-l-2 border-dashed border-brand-border" />
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-white text-sm font-bold text-center leading-tight z-10">
            {data.end}
          </div>
        </div>

        {/* עמודה ימין */}
        <div className="flex flex-col gap-3 flex-1 items-start pt-16">
          {rightPool.map(word => (
            <button key={word} onClick={() => handlePoolClick(word)}
              className={`px-3 py-2 rounded-2xl text-sm font-medium border transition-all
                ${selected === word
                  ? "bg-brand-accent border-brand-accent text-white scale-95"
                  : "bg-brand-surface border-brand-border text-brand-text hover:border-brand-accent"}`}>
              {word}
            </button>
          ))}
        </div>
      </div>

      {/* כפתורים */}
      {!finished && (
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={handleHint} disabled={locked.every(Boolean)}
            className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm hover:bg-yellow-500/20 transition-colors disabled:opacity-30">
            💡 רמז
          </button>
          <button
            onClick={() => {
              const toReturn = slots.filter((s, i) => !locked[i] && s !== null) as string[];
              const newSlots = slots.map((s, i) => locked[i] ? s : null);
              setSlots(newSlots);
              setPool(prev => shuffle([...prev, ...toReturn]));
              setSelected(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-brand-muted text-sm hover:text-brand-text transition-colors">
            ↺ ניקוי לוח
          </button>
          <button onClick={handleCheck} disabled={!allFilled}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-accent hover:bg-brand-accentHover disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors">
            ✓ אישור
          </button>
        </div>
      )}

      {finished && <GameResult solved={won} score={score} shareText={shareText} />}
    </div>
  );
}
