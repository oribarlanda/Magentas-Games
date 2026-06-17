"use client";
import { useState } from "react";
import type { WhoAmIData } from "@/types";
import { saveScore, calcScore } from "@/lib/storage";
import GameResult from "@/components/ui/GameResult";

export default function WhoAmIGame({ data }: { data: WhoAmIData }) {
  const [cluesShown, setCluesShown] = useState(1);
  const [input, setInput] = useState("");
  const [finished, setFinished] = useState(false);
  const [won, setWon] = useState(false);
  const [wrong, setWrong] = useState(false);

  const totalHints = data.clues.length - 1;
  const hintsUsed = cluesShown - 1;

  const norm = (s: string) => s.trim().toLowerCase().replace(/['"]/g, "");

  const check = () => {
    if (data.acceptedAnswers.some(a => norm(a) === norm(input))) {
      const score = calcScore(100, hintsUsed, totalHints);
      saveScore({ gameId: "who-am-i", score, solved: true, hintsUsed, completedAt: Date.now() });
      window.dispatchEvent(new Event("score-updated"));
      setWon(true);
      setFinished(true);
    } else {
      setWrong(true);
      setTimeout(() => setWrong(false), 900);
    }
  };

  const score = calcScore(100, hintsUsed, totalHints);
  const shareText = `🕵️ פתרתי את "מי אני"!\nניחשתי תוך ${cluesShown} רמז${cluesShown > 1 ? "ים" : ""}\nניקוד: ${score}`;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {data.clues.slice(0, cluesShown).map((clue, i) => (
          <div key={i} className="flex gap-3 items-start bg-brand-surface border border-brand-border rounded-xl p-4 animate-slide-up">
            <div className="w-6 h-6 rounded-full bg-brand-accent/20 text-brand-accent text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</div>
            <p className="text-brand-text">{clue}</p>
          </div>
        ))}
      </div>

      {!finished && (
        <>
          {cluesShown < data.clues.length && (
            <button onClick={() => setCluesShown(c => c + 1)} className="w-full py-2.5 border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 rounded-xl text-sm hover:bg-yellow-500/20 transition-colors">
              💡 רמז נוסף ({data.clues.length - cluesShown} נותרו)
            </button>
          )}
          <div className={wrong ? "animate-shake" : ""}>
            <input type="text" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && check()}
              placeholder="מי אני?"
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder-brand-muted outline-none focus:border-brand-accent transition-colors text-right"
              dir="rtl" />
          </div>
          <button onClick={check} disabled={!input.trim()} className="w-full py-3 bg-brand-accent hover:bg-brand-accentHover disabled:opacity-40 text-white rounded-xl font-medium transition-colors">ניחוש</button>
        </>
      )}

      {finished && (
        <div className="space-y-3">
          <div className="bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm">
            <span className="text-brand-muted">התשובה: </span>
            <span className="text-brand-text font-bold">{data.answer}</span>
          </div>
          <GameResult solved={won} score={score} shareText={shareText} />
        </div>
      )}
    </div>
  );
}
