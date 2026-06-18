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

const CIRCLE_SIZE = 64; // px – גודל אחיד לכל העיגולים

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

  // גרירה
  const dragging = useRef<{ word: string; from: "pool" | "slot"; slotIdx?: number } | null>(null);
  const [dragWord, setDragWord] = useState<string | null>(null);

  // refs לחריצים ול-pool circles כדי לזהות drop
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const poolRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  const norm = (s: string) => s.trim().toLowerCase();

  // ── ניצחון ──
  const checkWin = useCallback((newLocked: boolean[], newSlots: (string | null)[]) => {
    if (newLocked.every(Boolean)) {
      const score = calcScore(100, hintsUsed, data.links.length);
      saveScore({ gameId: "chain", score, solved: true, hintsUsed, completedAt: Date.now() });
      window.dispatchEvent(new Event("score-updated"));
      setWon(true);
      setFinished(true);
    }
  }, [hintsUsed, data.links.length]);

  // ── אישור ──
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
    checkWin(newLocked, newSlots);
  }, [slots, locked, answers, checkWin]);

  // ── רמז ──
  const handleHint = () => {
    const idx = answers.findIndex((ans, i) => !locked[i] && slots[i] !== ans);
    if (idx === -1) return;
    const correctWord = answers[idx];
    const prevInSlot = slots[idx];
    const newSlots = [...slots]; newSlots[idx] = correctWord;
    const newLocked = [...locked]; newLocked[idx] = true;
    setPool(prev => {
      let next = prev.filter(w => w !== correctWord);
      if (prevInSlot !== null && prevInSlot !== correctWord) next.push(prevInSlot);
      return next;
    });
    setSlots(newSlots);
    setLocked(newLocked);
    setHintsUsed(h => h + 1);
    setDragWord(null);
    checkWin(newLocked, newSlots);
  };

  // ── ניקוי ──
  const handleClear = () => {
    const toReturn = slots.filter((s, i) => !locked[i] && s !== null) as string[];
    setSlots(prev => prev.map((s, i) => locked[i] ? s : null));
    setPool(prev => shuffle([...prev, ...toReturn]));
    setDragWord(null);
  };

  // ── הנח מילה בחריץ ──
  const placeWord = useCallback((word: string, fromPool: boolean, fromSlotIdx: number | undefined, toSlotIdx: number) => {
    if (locked[toSlotIdx]) return;
    const prevInSlot = slots[toSlotIdx];
    const newSlots = [...slots];
    newSlots[toSlotIdx] = word;
    setSlots(newSlots);
    if (fromPool) {
      setPool(prev => {
        const next = prev.filter(w => w !== word);
        if (prevInSlot !== null) next.push(prevInSlot);
        return next;
      });
    } else if (fromSlotIdx !== undefined) {
      const s2 = [...newSlots];
      s2[fromSlotIdx] = prevInSlot;
      setSlots(s2);
    }
  }, [slots, locked]);

  // ── החזר מילה ל-pool ──
  const returnToPool = useCallback((slotIdx: number) => {
    if (locked[slotIdx] || slots[slotIdx] === null) return;
    const word = slots[slotIdx]!;
    const newSlots = [...slots]; newSlots[slotIdx] = null;
    setSlots(newSlots);
    setPool(prev => [...prev, word]);
  }, [slots, locked]);

  // ══════════════════════════════════════════
  // DRAG & DROP – Mouse
  // ══════════════════════════════════════════
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

      // בדוק אם הפלה על חריץ
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
      // אם גרר מחריץ ולא הפיל על שום מקום – החזר ל-pool
      if (from === "slot" && fromSlot !== undefined) {
        returnToPool(fromSlot);
      }
    };
    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, [placeWord, returnToPool]);

  // ══════════════════════════════════════════
  // DRAG & DROP – Touch
  // ══════════════════════════════════════════
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
      if (from === "slot" && fromSlot !== undefined) {
        returnToPool(fromSlot);
      }
    };
    window.addEventListener("touchend", onTouchEnd);
    return () => window.removeEventListener("touchend", onTouchEnd);
  }, [placeWord, returnToPool]);

  // ══════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════
  const allFilled = slots.every((s, i) => locked[i] || s !== null);
  const score = calcScore(100, hintsUsed, data.links.length);
  const shareText = `⛓️ פתרתי את "השרשרת"!\n${data.start} → ... → ${data.end}\nניקוד: ${score}`;

  const leftPool = pool.filter((_, i) => i % 2 === 0);
  const rightPool = pool.filter((_, i) => i % 2 === 1);

  const CircleStyle = `
    rounded-full border-2 flex items-center justify-center
    text-sm font-bold text-center leading-tight
    cursor-grab active:cursor-grabbing select-none transition-all
  `;

  return (
    <div className="space-y-5">
      <div className="flex gap-1 items-start justify-center">

        {/* עמודה שמאל */}
        <div className="flex flex-col gap-3 items-end pt-20 flex-1">
          {leftPool.map(word => (
            <div
              key={word}
              ref={el => poolRefs.current.set(word, el)}
              style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
              onMouseDown={e => onMouseDown(e, word, "pool")}
              onTouchStart={e => onTouchStart(e, word, "pool")}
              className={`${CircleStyle} ${
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
          {/* נקודת התחלה */}
          <div
            style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
            className="rounded-full bg-gray-800 flex items-center justify-center text-white text-sm font-bold z-10"
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
                className={`${CircleStyle} ${
                  locked[i]
                    ? "bg-green-400 border-green-400 text-white cursor-default"
                    : slots[i]
                    ? dragWord === slots[i]
                      ? "bg-brand-accent/50 border-brand-accent text-white opacity-60"
                      : "bg-brand-accent border-brand-accent text-white"
                    : "border-dashed border-brand-muted bg-brand-surface text-transparent cursor-default"
                }`}
              >
                {slots[i] ?? ""}
              </div>
            </div>
          ))}

          <div className="w-px h-3 border-l-2 border-dashed border-brand-border" />
          {/* נקודת סוף */}
          <div
            style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
            className="rounded-full bg-gray-800 flex items-center justify-center text-white text-sm font-bold z-10"
          >
            {data.end}
          </div>
        </div>

        {/* עמודה ימין */}
        <div className="flex flex-col gap-3 items-start pt-20 flex-1">
          {rightPool.map(word => (
            <div
              key={word}
              ref={el => poolRefs.current.set(word, el)}
              style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
              onMouseDown={e => onMouseDown(e, word, "pool")}
              onTouchStart={e => onTouchStart(e, word, "pool")}
              className={`${CircleStyle} ${
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
