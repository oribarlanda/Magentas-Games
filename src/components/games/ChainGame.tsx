"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import type { ChainData } from "@/types";
import { saveScore, calcScore } from "@/lib/storage";
import GameResult from "@/components/ui/GameResult";

interface ChainDataExtended extends ChainData {
  distractors?: string[];
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const CIRCLE_SIZE = 64;

export default function ChainGame({ data }: { data: ChainDataExtended }) {
  const answers = data.links.map(l => l.answer);
  const allWords = shuffle([...answers, ...(data.distractors ?? [])]);
  const total = answers.length;

  const [pool, setPool] = useState<string[]>(allWords);
  const [slots, setSlots] = useState<(string | null)[]>(Array(total).fill(null));
  const [locked, setLocked] = useState<boolean[]>(Array(total).fill(false));
  const [hintsUsed, setHintsUsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [won, setWon] = useState(false);
  const [dragWord, setDragWord] = useState<string | null>(null);

  const dragging = useRef<{ word: string; from: "pool" | "slot"; slotIdx?: number } | null>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const norm = (s: string) => s.trim().toLowerCase();

  const checkWin = useCallback((newLocked: boolean[], newSlots: (string | null)[]) => {
    if (newLocked.every(Boolean)) {
      const score = calcScore(100, hintsUsed, data.links.length);
      saveScore({ gameId: "chain", score, solved: true, hintsUsed, completedAt: Date.now() });
      window.dispatchEvent(new Event("score-updated"));
      setWon(true);
      setFinished(true);
    }
  }, [hintsUsed, data.links.length]);

  const placeWord = useCallback((word: string, fromPool: boolean, fromSlotIdx: number | undefined, toSlotIdx: number) => {
    if (locked[toSlotIdx]) return;
    setSlots(prevSlots => {
      const prevInSlot = prevSlots[toSlotIdx];
      const newSlots = [...prevSlots];
      newSlots[toSlotIdx] = word;
      if (!fromPool && fromSlotIdx !== undefined) {
        newSlots[fromSlotIdx] = prevInSlot;
      }
      if (fromPool) {
        setPool(prev => {
          const next = prev.filter(w => w !== word);
          if (prevInSlot !== null) next.push(prevInSlot);
          return next;
        });
      }
      return newSlots;
    });
  }, [locked]);

  const returnWordToPool = useCallback((slotIdx: number) => {
    setSlots(prevSlots => {
      if (locked[slotIdx] || prevSlots[slotIdx] === null) return prevSlots;
      const word = prevSlots[slotIdx]!;
      const newSlots = [...prevSlots];
      newSlots[slotIdx] = null;
      setPool(prev => [...prev, word]);
      return newSlots;
    });
  }, [locked]);

  const handleCheck = useCallback(() => {
    setSlots(prevSlots => {
      const newLocked = [...locked];
      const newSlots = [...prevSlots];
      const returnToPool: string[] = [];
      prevSlots.forEach((word, i) => {
        if (locked[i]) return;
        if (word !== null && norm(word) === norm(answers[i])) {
          newLocked[i] = true;
        } else if (word !== null) {
          returnToPool.push(word);
          newSlots[i] = null;
        }
      });
      setLocked(newLocked);
      setPool(prev => [...prev, ...returnToPool]);
      checkWin(newLocked, newSlots);
      return newSlots;
    });
  }, [locked, answers, checkWin]);

  const handleHint = () => {
    const idx = answers.findIndex((ans, i) => !locked[i] && slots[i] !== ans);
    if (idx === -1) return;
    const correctWord = answers[idx];
    const prevInSlot = slots[idx];
    const newSlots = [...slots]; newSlots[idx] = correctWord;
    const newLocked = [...locked]; newLocked[idx] = true;
    setPool(prev => {
      const next = prev.filter(w => w !== correctWord);
      if (prevInSlot !== null && prevInSlot !== correctWord) next.push(prevInSlot);
      return next;
    });
    setSlots(newSlots);
    setLocked(newLocked);
    setHintsUsed(h => h + 1);
    setDragWord(null);
    checkWin(newLocked, newSlots);
  };

  const handleClear = () => {
    setSlots(prevSlots => {
      const toReturn = prevSlots.filter((s, i) => !locked[i] && s !== null) as string[];
      setPool(prev => shuffle([...prev, ...toReturn]));
      return prevSlots.map((s, i) => locked[i] ? s : null);
    });
    setDragWord(null);
  };

  // ── Mouse events ──
  const onMouseDown = (e: React.MouseEvent, word: string, from: "pool" | "slot", slotIdx?: number) => {
    if (finished) return;
    e.preventDefault();
    dragging.current = { word, from, slotIdx };
    setDragWord(word);
  };

  useEffect(() => {
    const onMouseUp = (e: MouseEvent) => {
      if (!dragging.current) return;
      const { word, from, slotIdx: fromSlot } = dragging.current;
      dragging.current = null;
      setDragWord(null);
      for (let i = 0; i < slotRefs.current.length; i++) {
        const el = slotRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
          if (from === "pool") placeWord(word, true, undefined, i);
          else if (fromSlot !== undefined && fromSlot !== i) placeWord(word, false, fromSlot, i);
          return;
        }
      }
      if (from === "slot" && fromSlot !== undefined) returnWordToPool(fromSlot);
    };
    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, [placeWord, returnWordToPool]);

  // ── Touch events ──
  const onTouchStart = (e: React.TouchEvent, word: string, from: "pool" | "slot", slotIdx?: number) => {
    if (finished) return;
    dragging.current = { word, from, slotIdx };
    setDragWord(word);
  };

  useEffect(() => {
    const onTouchEnd = (e: TouchEvent) => {
      if (!dragging.current) return;
      const touch = e.changedTouches[0];
      const { word, from, slotIdx: fromSlot } = dragging.current;
      dragging.current = null;
      setDragWord(null);
      for (let i = 0; i < slotRefs.current.length; i++) {
        const el = slotRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
            touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
          if (from === "pool") placeWord(word, true, undefined, i);
          else if (fromSlot !== undefined && fromSlot !== i) placeWord(word, false, fromSlot, i);
          return;
        }
      }
      if (from === "slot" && fromSlot !== undefined) returnWordToPool(fromSlot);
    };
    window.addEventListener("touchend", onTouchEnd);
    return () => window.removeEventListener("touchend", onTouchEnd);
  }, [placeWord, returnWordToPool]);

  const allFilled = slots.every((s, i) => locked[i] || s !== null);
  const score = calcScore(100, hintsUsed, data.links.length);
  const shareText = `⛓️ פתרתי את "השרשרת"!\n${data.start} → ... → ${data.end}\nניקוד: ${score}`;

  const leftPool = pool.filter((_, i) => i % 2 === 0);
  const rightPool = pool.filter((_, i) => i % 2 === 1);

  const circleBase = `rounded-full border-2 flex items-center justify-center text-sm font-bold text-center leading-tight select-none transition-all`;

  return (
    <div className="space-y-5">
      <div className="flex gap-1 items-start justify-center">

        {/* עמודה שמאל */}
        <div className="flex flex-col gap-3 items-end pt-20 flex-1">
          {leftPool.map(word => (
            <div
              key={word}
              style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
              onMouseDown={e => onMouseDown(e, word, "pool")}
              onTouchStart={e => onTouchStart(e, word, "pool")}
              className={`${circleBase} cursor-grab active:cursor-grabbing ${
                dragWord === word
                  ? "bg-brand-accent border-brand-accent text-white opacity-60 scale-95"
                  : "bg-brand-surface border-brand-border text-brand-text hover:border-brand-accent"
              }`}
            >
              {word}
            </div>
          ))}
        </div>

        {/* שרשרת מרכזית */}
        <div className="flex flex-col items-center shrink-0">
          <div
            style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
            className="rounded-full bg-gray-800 flex items-center justify-center text-white text-sm font-bold"
          >
            {data.start}
          </div>

          {data.links.map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-px h-3 border-l-2 border-dashed border-brand-border" />
              <div
                ref={el => { slotRefs.current[i] = el; }}
                style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
                onMouseDown={slots[i] && !locked[i]
                  ? e => onMouseDown(e, slots[i]!, "slot", i)
                  : undefined}
                onTouchStart={slots[i] && !locked[i]
                  ? e => onTouchStart(e, slots[i]!, "slot", i)
                  : undefined}
                className={`${circleBase} ${
                  locked[i]
                    ? "bg-green-400 border-green-400 text-white cursor-default"
                    : slots[i]
                    ? "bg-brand-accent border-brand-accent text-white cursor-grab active:cursor-grabbing"
                    : "border-dashed border-brand-muted bg-brand-surface cursor-default"
                }`}
              >
                {slots[i] ?? ""}
              </div>
            </div>
          ))}

          <div className="w-px h-3 border-l-2 border-dashed border-brand-border" />
          <div
            style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
            className="rounded-full bg-gray-800 flex items-center justify-center text-white text-sm font-bold"
          >
            {data.end}
          </div>
        </div>

        {/* עמודה ימין */}
        <div className="flex flex-col gap-3 items-start pt-20 flex-1">
          {rightPool.map(word => (
            <div
              key={word}
              style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
              onMouseDown={e => onMouseDown(e, word, "pool")}
              onTouchStart={e => onTouchStart(e, word, "pool")}
              className={`${circleBase} cursor-grab active:cursor-grabbing ${
                dragWord === word
                  ? "bg-brand-accent border-brand-accent text-white opacity-60 scale-95"
                  : "bg-brand-surface border-brand-border text-brand-text hover:border-brand-accent"
              }`}
            >
              {word}
            </div>
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
          <button onClick={handleClear}
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
