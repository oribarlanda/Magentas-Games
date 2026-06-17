"use client";
import { useState } from "react";
import type { ChainData } from "@/types";
import { saveScore, calcScore } from "@/lib/storage";
import GameResult from "@/components/ui/GameResult";

export default function ChainGame({ data }: { data: ChainData }) {
  const [inputs, setInputs] = useState<string[]>(Array(data.links.length).fill(""));
  const [revealed, setRevealed] = useState<boolean[]>(Array(data.links.length).fill(false));
  const [hintsUsed, setHintsUsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [won, setWon] = useState(false);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);

  const norm = (s: string) => s.trim().toLowerCase();

  const checkLink = (i: number) => {
    if (norm(inputs[i]) === norm(data.links[i].answer)) {
      const next = [...revealed];
      next[i] = true;
      setRevealed(next);
      if (next.every(Boolean)) {
        const score = calcScore(100, hintsUsed, data.links.length);
        saveScore({ gameId: "chain", score, solved: true, hintsUsed, completedAt: Date.now() });
        window.dispatchEvent(new Event("score-updated"));
        setWon(true);
        setFinished(true);
      }
    } else {
      setWrongIdx(i);
      setTimeout(() => setWrongIdx(null), 900);
    }
  };

  const revealHint = (i: number) => {
    setHintsUsed(h => h + 1);
    const next = [...inputs];
    next[i] = "💡 " + data.links[i].hint;
    setInputs(next);
  };

  const score = calcScore(100, hintsUsed, data.links.length);
  const shareText = `⛓️ פתרתי את "השרשרת"!\n${data.start} → ... → ${data.end}\nניקוד: ${score}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 text-xs font-bold shrink-0">▶</div>
        <div className="flex-1 bg-brand-surface border border-brand-border rounded-xl px-4 py-3 font-bold text-brand-text">{data.start}</div>
      </div>

      {data.links.map((link, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-brand-muted text-xs shrink-0">{i + 1}</div>
          {revealed[i] ? (
            <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 font-medium animate-bounce-in">{link.answer}</div>
          ) : (
            <div className={`flex-1 flex gap-2 ${wrongIdx === i ? "animate-shake" : ""}`}>
              <input type="text" value={inputs[i]} placeholder={`חוליה ${i + 1}...`}
                onChange={e => { const n = [...inputs]; n[i] = e.target.value; setInputs(n); }}
                onKeyDown={e => e.key === "Enter" && checkLink(i)}
                disabled={finished}
                className="flex-1 bg-brand-surface border border-brand-border rounded-xl px-3 py-2.5 text-brand-text placeholder-brand-muted outline-none focus:border-brand-accent transition-colors text-sm text-right disabled:opacity-50"
                dir="rtl" />
              <button onClick={() => revealHint(i)} disabled={finished || inputs[i].startsWith("💡")}
                className="px-2.5 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-xs hover:bg-yellow-500/20 transition-colors disabled:opacity-30" title="רמז">💡</button>
              <button onClick={() => checkLink(i)} disabled={finished || !inputs[i].trim() || inputs[i].startsWith("💡")}
                className="px-3 py-2 bg-brand-accent hover:bg-brand-accentHover disabled:opacity-40 text-white rounded-xl text-xs font-medium transition-colors">✓</button>
            </div>
          )}
        </div>
      ))}

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-brand-accent/20 border border-brand-accent/40 flex items-center justify-center text-brand-accent text-xs font-bold shrink-0">■</div>
        <div className="flex-1 bg-brand-surface border border-brand-border rounded-xl px-4 py-3 font-bold text-brand-text">{data.end}</div>
      </div>

      {finished && <GameResult solved={won} score={score} shareText={shareText} />}
    </div>
  );
}
