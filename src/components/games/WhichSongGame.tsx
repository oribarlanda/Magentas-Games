"use client";
import { useState } from "react";
import type { SongData } from "@/types";
import { saveScore, calcScore } from "@/lib/storage";
import HintButton from "@/components/ui/HintButton";
import GameResult from "@/components/ui/GameResult";

export default function WhichSongGame({ data }: { data: SongData }) {
  const [input, setInput] = useState("");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [won, setWon] = useState(false);
  const [wrong, setWrong] = useState(false);

  const norm = (s: string) => s.trim().toLowerCase().replace(/["'״]/g, "");

  const check = () => {
    if (data.answers.some(a => norm(a) === norm(input))) {
      const score = calcScore(100, hintsUsed, data.hints.length);
      saveScore({ gameId: "which-song", score, solved: true, hintsUsed, completedAt: Date.now() });
      window.dispatchEvent(new Event("score-updated"));
      setWon(true);
      setFinished(true);
    } else {
      setWrong(true);
      setTimeout(() => setWrong(false), 900);
    }
  };

  const score = calcScore(100, hintsUsed, data.hints.length);
  const shareText = `🎵 פתרתי את "איזה שיר"!\nניקוד: ${score}`;

  return (
    <div className="space-y-5">
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
        <p className="text-brand-muted text-xs mb-2">תיאור השיר</p>
        <p className="text-brand-text text-base leading-relaxed">{data.prompt}</p>
      </div>

      {!finished && (
        <>
          <div className={wrong ? "animate-shake" : ""}>
            <input type="text" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && check()}
              placeholder="שם השיר..."
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder-brand-muted outline-none focus:border-brand-accent transition-colors text-right"
              dir="rtl" />
          </div>
          <HintButton hints={data.hints} hintsUsed={hintsUsed} onHint={() => setHintsUsed(h => h + 1)} disabled={finished} />
          <button onClick={check} disabled={!input.trim()} className="w-full py-3 bg-brand-accent hover:bg-brand-accentHover disabled:opacity-40 text-white rounded-xl font-medium transition-colors">בדיקה</button>
        </>
      )}

      {finished && (
        <div className="space-y-3">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4 text-sm">
            <span className="text-brand-muted">השיר: </span>
            <span className="text-brand-text font-medium">{data.answers[0]}</span>
            {data.artist && <span className="text-brand-muted"> / {data.artist}</span>}
          </div>
          <GameResult solved={won} score={score} shareText={shareText} />
        </div>
      )}
    </div>
  );
}
