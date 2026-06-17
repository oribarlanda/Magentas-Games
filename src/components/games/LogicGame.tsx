"use client";
import { useState, useEffect, useCallback } from "react";
import type { LogicData, GameId } from "@/types";
import { saveScore, calcScore } from "@/lib/storage";
import GameResult from "@/components/ui/GameResult";

const MAX_ATTEMPTS = 3;

// פיצול תשובה למילים עם אינדקסים גלובליים
// לדוגמה: "אח של" → [{word:"אח", indices:[0,1]}, {word:"של", indices:[3,4,5]}]
// הרווח (אינדקס 2) מדולג אוטומטית
function buildWords(answer: string): { char: string; globalIdx: number }[][] {
  const words: { char: string; globalIdx: number }[][] = [];
  let currentWord: { char: string; globalIdx: number }[] = [];
  for (let i = 0; i < answer.length; i++) {
    if (answer[i] === " ") {
      if (currentWord.length > 0) { words.push(currentWord); currentWord = []; }
    } else {
      currentWord.push({ char: answer[i], globalIdx: i });
    }
  }
  if (currentWord.length > 0) words.push(currentWord);
  return words;
}

export default function LogicGame({ data, gameId }: { data: LogicData; gameId: GameId }) {
  const answer = data.answers[0].trim();
  const answerChars = answer.split(""); // כולל רווחים
  const totalLen = answerChars.length;
  const words = buildWords(answer);

  // אינדקסים שאינם רווח
  const letterIndices = answerChars
    .map((c, i) => (c !== " " ? i : -1))
    .filter(i => i !== -1);

  const [typed, setTyped] = useState<string[]>(Array(totalLen).fill(""));
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [locked, setLocked] = useState<Set<number>>(new Set());
  const [activeIdx, setActiveIdx] = useState<number | null>(letterIndices[0] ?? null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [attempts, setAttempts] = useState(MAX_ATTEMPTS);
  const [shake, setShake] = useState(false);
  const [finished, setFinished] = useState(false);
  const [won, setWon] = useState(false);

  const maxHints = 2;

  // מצא את האינדקס הבא הפנוי (לא רווח, לא נעול, לא נחשף)
  const nextFreeIdx = useCallback((from: number, direction: 1 | -1 = 1): number | null => {
    let i = from + direction;
    while (i >= 0 && i < totalLen) {
      if (answerChars[i] !== " " && !locked.has(i) && !revealed.has(i)) return i;
      i += direction;
    }
    return null;
  }, [answerChars, locked, revealed, totalLen]);

  useEffect(() => {
    // אחרי כל שינוי ב-locked/revealed, מצא את הראשון הפנוי
    const first = letterIndices.find(i => !locked.has(i) && !revealed.has(i));
    setActiveIdx(first ?? null);
  }, [locked, revealed]); // eslint-disable-line

  const handleCheck = useCallback(() => {
    // בנה ניחוש: רווחים נשארים רווחים, שאר לפי typed/locked/revealed
    const guess = answerChars.map((correct, i) => {
      if (correct === " ") return " ";
      if (locked.has(i) || revealed.has(i)) return correct;
      return typed[i] || "";
    });

    if (guess.some((c, i) => answerChars[i] !== " " && !c)) return;

    const guessWord = guess.join("");
    const norm = (s: string) => s.trim().toLowerCase().replace(/[!?.״]/g, "");
    const isCorrect = data.answers.some(a => norm(a) === norm(guessWord));

    if (isCorrect) {
      setLocked(new Set(letterIndices));
      const score = calcScore(100, hintsUsed, maxHints);
      saveScore({ gameId, score, solved: true, hintsUsed, completedAt: Date.now() });
      window.dispatchEvent(new Event("score-updated"));
      setWon(true);
      setFinished(true);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 600);

      const newLocked = new Set(locked);
      const newTyped = [...typed];
      letterIndices.forEach(i => {
        if (locked.has(i) || revealed.has(i)) return;
        if (typed[i] === answerChars[i]) {
          newLocked.add(i);
        } else {
          newTyped[i] = "";
        }
      });
      setLocked(newLocked);
      setTyped(newTyped);

      const next = attempts - 1;
      setAttempts(next);
      if (next <= 0) {
        saveScore({ gameId, score: 0, solved: false, hintsUsed, completedAt: Date.now() });
        setFinished(true);
      }
    }
  }, [typed, locked, revealed, answerChars, letterIndices, attempts, hintsUsed, data.answers, gameId]); // eslint-disable-line

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (finished) return;
    const key = e.key;

    if (key === "Enter") { handleCheck(); return; }

    if (key === "Backspace") {
      if (activeIdx === null) return;
      if (typed[activeIdx] && !locked.has(activeIdx) && !revealed.has(activeIdx)) {
        const next = [...typed]; next[activeIdx] = ""; setTyped(next);
      } else {
        const prev = nextFreeIdx(activeIdx, -1);
        if (prev !== null) {
          const next = [...typed]; next[prev] = ""; setTyped(next); setActiveIdx(prev);
        }
      }
      return;
    }

    if (key.length === 1) {
      if (activeIdx === null) return;
      const next = [...typed]; next[activeIdx] = key; setTyped(next);
      const nxt = nextFreeIdx(activeIdx, 1);
      if (nxt !== null) setActiveIdx(nxt);
    }
  }, [finished, activeIdx, typed, locked, revealed, handleCheck, nextFreeIdx]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const handleCellClick = (i: number) => {
    if (locked.has(i) || revealed.has(i) || finished) return;
    setActiveIdx(i);
  };

  const handleHint = () => {
    if (hintsUsed >= maxHints) return;
    for (const i of letterIndices) {
      if (!locked.has(i) && !revealed.has(i)) {
        const newRevealed = new Set(revealed); newRevealed.add(i);
        const newTyped = [...typed]; newTyped[i] = "";
        setRevealed(newRevealed); setTyped(newTyped);
        setHintsUsed(h => h + 1);
        break;
      }
    }
  };

  const handleClearAll = () => {
    const next = [...typed];
    letterIndices.forEach(i => { if (!locked.has(i) && !revealed.has(i)) next[i] = ""; });
    setTyped(next);
    const first = letterIndices.find(i => !locked.has(i) && !revealed.has(i));
    setActiveIdx(first ?? null);
  };

  const getCellState = (i: number) => {
