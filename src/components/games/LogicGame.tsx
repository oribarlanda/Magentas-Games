"use client";
import { useState, useEffect, useCallback } from "react";
import type { LogicData } from "@/types";
import { saveScore, calcScore } from "@/lib/storage";
import GameResult from "@/components/ui/GameResult";

const MAX_ATTEMPTS = 3;

export default function LogicGame({ data }: { data: LogicData }) {
  const answer = data.answers[0].trim();
  const answerLetters = answer.split("");
  const wordLength = answerLetters.length;

  const [typed, setTyped] = useState<string[]>(Array(wordLength).fill(""));
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [locked, setLocked] = useState<Set<number>>(new Set());
  const [activeIdx, setActiveIdx] = useState<number | null>(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [attempts, setAttempts] = useState(MAX_ATTEMPTS);
  const [shake, setShake] = useState(false);
  const [finished, setFinished] = useState(false);
  const [won, setWon] = useState(false);

  const maxHints = 2;

  useEffect(() => {
    const firstFree = answerLetters.findIndex((_, i) => !locked.has(i) && !revealed.has(i));
    setActiveIdx(firstFree === -1 ? null : firstFree);
  }, [locked, revealed]); // eslint-disable-line

  const handleCheck = useCallback(() => {
    const guess = answerLetters.map((correct, i) => {
      if (locked.has(i) || revealed.has(i)) return correct;
      return typed[i] || "";
    });

    if (guess.some(c => !c)) return;

    const guessWord = guess.join("");
    const norm = (s: string) => s.trim().toLowerCase().replace(/[!?.״ ]/g, "");
    const isCorrect = data.answers.some(a => norm(a) === norm(guessWord));

    if (isCorrect) {
      setLocked(new Set(answerLetters.map((_, i) => i)));
      const score = calcScore(100, hintsUsed, maxHints);
      saveScore({ gameId: "logic", score, solved: true, hintsUsed, completedAt: Date.now() });
      window.dispatchEvent(new Event("score-updated"));
      setWon(true);
      setFinished(true);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 600);

      const newLocked = new Set(locked);
      const newTyped = [...typed];
      answerLetters.forEach((correct, i) => {
        if (locked.has(i) || revealed.has(i)) return;
        if (typed[i] === correct) {
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
        saveScore({ gameId: "logic", score: 0, solved: false, hintsUsed, completedAt: Date.now() });
        setFinished(true);
      }
    }
  }, [typed, locked, revealed, answerLetters, attempts, hintsUsed, data.answers]); // eslint-disable-line

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (finished) return;
    const key = e.key;

    if (key === "Enter") {
      handleCheck();
      return;
    }

    if (key === "Backspace") {
      if (activeIdx === null) return;
      if (typed[activeIdx] && !locked.has(activeIdx) && !revealed.has(activeIdx)) {
        const next = [...typed];
        next[activeIdx] = "";
        setTyped(next);
      } else {
        for (let i = activeIdx - 1; i >= 0; i--) {
          if (!locked.has(i) && !revealed.has(i)) {
            const next = [...typed];
            next[i] = "";
            setTyped(next);
            setActiveIdx(i);
            break;
          }
        }
      }
      return;
    }

    if (key.length === 1) {
      if (activeIdx === null) return;
      const next = [...typed];
      next[activeIdx] = key;
      setTyped(next);
      for (let i = activeIdx + 1; i < wordLength; i++) {
        if (!locked.has(i) && !revealed.has(i)) {
          setActiveIdx(i);
          break;
        }
      }
    }
  }, [finished, activeIdx, typed, locked, revealed, wordLength, handleCheck]);

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
    for (let i = 0; i < wordLength; i++) {
      if (!locked.has(i) && !revealed.has(i)) {
        const newRevealed = new Set(revealed);
        newRevealed.add(i);
        const newTyped = [...typed];
        newTyped[i] = "";
        setRevealed(newRevealed);
        setTyped(newTyped);
        setHintsUsed(h => h + 1);
        break;
      }
    }
  };

  const handleClearAll = () => {
    const next = typed.map((_, i) =>
      locked.has(i) || revealed.has(i) ? typed[i] : ""
    );
    setTyped(next);
    const firstFree = answerLetters.findIndex((_, i) => !locked.has(i) && !revealed.has(i));
    setActiveIdx(firstFree === -1 ? null : firstFree);
  };

  const getCellState = (i: number) => {
    if (locked.has(i)) return "locked";
    if (revealed.has(i)) return "revealed";
    if (activeIdx === i) return "active";
    return "empty";
  };

  const allFilled = answerLetters.every((_, i) =>
    locked.has(i) || revealed.has(i) || typed[i]
  );

  const score = calcScore(100, hintsUsed, maxHints);
  const shareText = `🧠 פתרתי את "הגיונית"!\nניקוד: ${score}`;

  return (
    <div className="space-y-6">
      {/* שאלה */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
        <p className="text-brand-text text-lg leading-relaxed font-medium text-right">{data.question}</p>
      </div>

      {/* רשת אותיות */}
      <div className={`flex justify-center gap-2 flex-wrap ${shake ? "animate-shake" : ""}`} dir="rtl">
        {answerLetters.map((correct, i) => {
          const state = getCellState(i);
          const displayLetter =
            state === "locked" ? correct :
            state === "revealed" ? correct :
            typed[i] || "";

          return (
            <button
              key={i}
              onClick={() => handleCellClick(i)}
              disabled={finished}
              className={`
                w-12 h-14 rounded-xl border-2 text-xl font-bold transition-all flex items-center justify-center
                ${state === "locked"
                  ? "bg-green-500 border-green-500 text-white"
                  : state === "revealed"
                  ? "bg-green-200 border-green-400 text-green-800"
                  : state === "active"
                  ? "bg-brand-surface border-brand-accent text-brand-text shadow-sm shadow-brand-accent/30"
                  : "bg-brand-surface border-brand-border text-brand-text hover:border-brand-muted"}
              `}
            >
              {displayLetter}
            </button>
          );
        })}
      </div>

      {/* מקלדת וירטואלית */}
      {!finished && <VirtualKeyboard onKey={(k) => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
      }} />}

      {/* כפתורי פעולה */}
      {!finished && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={handleHint}
            disabled={hintsUsed >= maxHints}
            className="flex flex-col items-center gap-1 px-3 py-2 bg-brand-surface border border-brand-border rounded-xl text-brand-muted hover:text-brand-text
