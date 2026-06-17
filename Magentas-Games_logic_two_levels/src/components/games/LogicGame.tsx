"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LogicData } from "@/types";
import { calcScore, saveScore } from "@/lib/storage";
import GameResult from "@/components/ui/GameResult";

const MAX_HINTS = 2;
const MAX_ATTEMPTS = 5;

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[!?.״"'\s]/g, "");
}

function getNextOpenIndex(start: number, fixed: boolean[], length: number) {
  for (let i = start; i < length; i += 1) {
    if (!fixed[i]) return i;
  }

  for (let i = 0; i < length; i += 1) {
    if (!fixed[i]) return i;
  }

  return null;
}

function HebrewKeyboard({ onKey }: { onKey: (key: string) => void }) {
  const rows = ["קראטוןםפ", "שדגכעיחלךף", "זסבהנמצתץ"];

  return (
    <div className="space-y-2" dir="rtl">
      {rows.map((row) => (
        <div key={row} className="flex justify-center gap-1.5">
          {row.split("").map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => onKey(letter)}
              className="h-10 min-w-8 rounded-lg border border-brand-border bg-brand-surface px-2 text-sm font-bold text-brand-text transition-colors hover:border-brand-accent"
            >
              {letter}
            </button>
          ))}
        </div>
      ))}

      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={() => onKey("Backspace")}
          className="rounded-lg border border-brand-border bg-brand-surface px-4 py-2 text-sm text-brand-text"
        >
          מחיקה
        </button>
        <button
          type="button"
          onClick={() => onKey("Enter")}
          className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-bold text-white"
        >
          בדיקה
        </button>
      </div>
    </div>
  );
}

export default function LogicGame({ data, difficulty }: { data: LogicData; difficulty?: string }) {
  const answer = data.answers[0].trim();
  const letters = useMemo(() => answer.split(""), [answer]);
  const length = letters.length;

  const [typed, setTyped] = useState<string[]>(() => Array(length).fill(""));
  const [locked, setLocked] = useState<boolean[]>(() => Array(length).fill(false));
  const [hinted, setHinted] = useState<boolean[]>(() => Array(length).fill(false));
  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [message, setMessage] = useState("");
  const [shake, setShake] = useState(false);
  const [finished, setFinished] = useState(false);
  const [solved, setSolved] = useState(false);

  const fixed = useMemo(
    () => letters.map((_, index) => locked[index] || hinted[index]),
    [letters, locked, hinted],
  );

  const score = calcScore(100, hintsUsed, MAX_HINTS);

  const finishGame = useCallback(
    (success: boolean) => {
      saveScore({
        gameId: "logic",
        score: success ? score : 0,
        solved: success,
        hintsUsed,
        completedAt: Date.now(),
      });

      window.dispatchEvent(new Event("score-updated"));
      setSolved(success);
      setFinished(true);
    },
    [hintsUsed, score],
  );

  const moveToNextOpen = useCallback(
    (fromIndex: number) => {
      setActiveIndex(getNextOpenIndex(fromIndex, fixed, length));
    },
    [fixed, length],
  );

  const checkAnswer = useCallback(() => {
    if (finished) return;

    const guess = letters
      .map((letter, index) => (fixed[index] ? letter : typed[index] || ""))
      .join("");

    if (guess.length !== length || guess.split("").some((letter) => !letter)) {
      setMessage("מלאו את כל האותיות לפני בדיקה.");
      return;
    }

    const isCorrect = data.answers.some((accepted) => normalize(accepted) === normalize(guess));

    if (isCorrect) {
      setLocked(Array(length).fill(true));
      setMessage("נכון!");
      finishGame(true);
      return;
    }

    const nextLocked = [...locked];
    const nextTyped = [...typed];

    letters.forEach((letter, index) => {
      if (fixed[index]) return;

      if (typed[index] === letter) {
        nextLocked[index] = true;
      } else {
        nextTyped[index] = "";
      }
    });

    setLocked(nextLocked);
    setTyped(nextTyped);

    const nextAttempts = attemptsLeft - 1;
    setAttemptsLeft(nextAttempts);
    setShake(true);
    setTimeout(() => setShake(false), 500);

    if (nextAttempts <= 0) {
      setMessage("נגמרו הניסיונות.");
      finishGame(false);
      return;
    }

    setMessage("לא מדויק. האותיות הנכונות נשארו בירוק.");
    moveToNextOpen(0);
  }, [attemptsLeft, data.answers, finishGame, finished, fixed, length, letters, locked, moveToNextOpen, typed]);

  const insertLetter = useCallback(
    (letter: string) => {
      if (finished) return;
      const currentIndex = activeIndex ?? getNextOpenIndex(0, fixed, length);
      if (currentIndex === null || fixed[currentIndex]) return;

      const nextTyped = [...typed];
      nextTyped[currentIndex] = letter;
      setTyped(nextTyped);
      moveToNextOpen(currentIndex + 1);
    },
    [activeIndex, finished, fixed, length, moveToNextOpen, typed],
  );

  const deleteLetter = useCallback(() => {
    if (finished) return;
    const currentIndex = activeIndex ?? getNextOpenIndex(0, fixed, length);
    if (currentIndex === null) return;

    if (!fixed[currentIndex] && typed[currentIndex]) {
      const nextTyped = [...typed];
      nextTyped[currentIndex] = "";
      setTyped(nextTyped);
      return;
    }

    for (let i = currentIndex - 1; i >= 0; i -= 1) {
      if (!fixed[i]) {
        const nextTyped = [...typed];
        nextTyped[i] = "";
        setTyped(nextTyped);
        setActiveIndex(i);
        return;
      }
    }
  }, [activeIndex, finished, fixed, length, typed]);

  const handleVirtualKey = (key: string) => {
    if (key === "Enter") {
      checkAnswer();
      return;
    }

    if (key === "Backspace") {
      deleteLetter();
      return;
    }

    insertLetter(key);
  };

  const handleHint = () => {
    if (finished || hintsUsed >= MAX_HINTS) return;

    const openIndex = letters.findIndex((_, index) => !fixed[index]);
    if (openIndex === -1) return;

    const nextHinted = [...hinted];
    const nextTyped = [...typed];
    nextHinted[openIndex] = true;
    nextTyped[openIndex] = "";

    setHinted(nextHinted);
    setTyped(nextTyped);
    setHintsUsed((current) => current + 1);
    setMessage("נחשפה אות בירוק.");
    moveToNextOpen(openIndex + 1);
  };

  const clearOpenLetters = () => {
    setTyped((current) => current.map((value, index) => (fixed[index] ? value : "")));
    setMessage("");
    moveToNextOpen(0);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        checkAnswer();
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        deleteLetter();
        return;
      }

      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        insertLetter(event.key);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [checkAnswer, deleteLetter, insertLetter]);

  const shareText = `🧠 פתרתי את "הגיונית${difficulty ? ` - ${difficulty}` : ""}"!\nניקוד: ${solved ? score : 0}`;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-border bg-brand-surface p-5">
        <p className="text-right text-lg font-medium leading-relaxed text-brand-text">{data.question}</p>
      </div>

      <div className={`flex flex-wrap justify-center gap-2 ${shake ? "animate-shake" : ""}`} dir="rtl">
        {letters.map((letter, index) => {
          const isFixed = fixed[index];
          const value = isFixed ? letter : typed[index] || "";

          return (
            <button
              key={index}
              type="button"
              onClick={() => {
                if (!isFixed && !finished) setActiveIndex(index);
              }}
              disabled={finished}
              className={`flex h-14 w-12 items-center justify-center rounded-xl border-2 text-xl font-bold outline-none transition-all ${
                isFixed
                  ? "border-green-600 bg-green-100 text-black"
                  : activeIndex === index
                    ? "border-brand-accent bg-white text-black shadow-sm shadow-brand-accent/30"
                    : "border-brand-border bg-white text-black hover:border-brand-muted"
              }`}
              aria-label={`אות ${index + 1}`}
            >
              {value}
            </button>
          );
        })}
      </div>

      {!finished && (
        <div className="space-y-4">
          <HebrewKeyboard onKey={handleVirtualKey} />

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={checkAnswer}
              className="rounded-xl bg-brand-accent px-5 py-2.5 font-bold text-white transition-colors hover:bg-brand-accentHover"
            >
              בדיקה
            </button>

            <button
              type="button"
              onClick={handleHint}
              disabled={hintsUsed >= MAX_HINTS}
              className="rounded-xl border border-brand-border bg-brand-surface px-5 py-2.5 text-sm font-medium text-brand-text transition-colors hover:border-brand-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              רמז ({hintsUsed}/{MAX_HINTS})
            </button>

            <button
              type="button"
              onClick={clearOpenLetters}
              className="rounded-xl border border-brand-border bg-brand-surface px-5 py-2.5 text-sm font-medium text-brand-muted transition-colors hover:text-brand-text"
            >
              ניקוי
            </button>
          </div>

          <p className="text-center text-sm text-brand-muted">נשארו {attemptsLeft} ניסיונות</p>
        </div>
      )}

      {message && <p className="text-center text-sm font-medium text-brand-muted">{message}</p>}

      {finished && (
        <GameResult
          solved={solved}
          score={solved ? score : 0}
          explanation={data.explanation}
          shareText={shareText}
        />
      )}
    </div>
  );
}
