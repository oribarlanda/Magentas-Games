"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { saveScore, calcScore } from "@/lib/storage";
import GameResult from "@/components/ui/GameResult";

interface SongDataExtended {
  answers: string[];
  songTitle: string;
  artist: string;
  year: string;
  image?: string;
  audio?: string;
  lines: string[];
}

export default function WhichSongGame({ data }: { data: SongDataExtended }) {
  const [input, setInput] = useState("");
  const [linesShown, setLinesShown] = useState(1);   // כמה שורות נחשפו
  const [hintUsed, setHintUsed] = useState(false);   // האם לחצו "תנו לי רמז"
  const [finished, setFinished] = useState(false);
  const [won, setWon] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const totalLines = data.lines.length;
  // ניקוד: מבוסס על כמה שורות נחשפו + האם השתמשו ברמז
  const hintsUsed = (linesShown - 1) + (hintUsed ? 1 : 0);
  const totalHints = totalLines - 1 + 1; // שורות + רמז

  const norm = (s: string) => s.trim().toLowerCase().replace(/['"״"״]/g, "");

  const check = () => {
    if (!input.trim()) return;
    if (data.answers.some(a => norm(a) === norm(input))) {
      const score = calcScore(100, hintsUsed, totalHints);
      saveScore({ gameId: "which-song", score, solved: true, hintsUsed, completedAt: Date.now() });
      window.dispatchEvent(new Event("score-updated"));
      setWon(true);
      setFinished(true);
    } else {
      setWrong(true);
      setTimeout(() => setWrong(false), 700);
      // חשוף שורה נוספת אחרי ניחוש שגוי
      if (linesShown < totalLines) {
        setLinesShown(s => s + 1);
      }
    }
    setInput("");
  };

  const handleHint = () => {
    setHintUsed(true);
  };

  const handleAudio = () => {
    if (!data.audio) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(data.audio);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const showNextLine = () => {
    if (linesShown < totalLines) setLinesShown(s => s + 1);
  };

  const score = calcScore(100, hintsUsed, totalHints);
  const shareText = `🎵 פתרתי את "איזה שיר"!\nניקוד: ${score}`;

  return (
    <div className="space-y-5">

      {/* ── אזור עליון: תמונה + שם שיר/אמן ── */}
      <div className="flex gap-3 items-start">

        {/* צד ימין: מידע */}
        <div className="flex-1 space-y-2">
          {/* שם השיר – מטושטש עד פתרון */}
          <div className={`rounded-xl px-3 py-2 text-sm font-bold transition-all duration-500 bg-brand-surface border border-brand-border ${!finished ? "blur-sm select-none" : "text-brand-text"}`}>
            {data.songTitle}
          </div>

          {/* אמן + שנה – מטושטש עד רמז */}
          <div className={`rounded-xl px-3 py-2 text-sm transition-all duration-500 bg-brand-surface border border-brand-border ${!hintUsed ? "blur-sm select-none" : "text-brand-text"}`}>
            {data.artist}, {data.year}
          </div>

          {/* כפתור רמז / השמע */}
          {!finished && (
            !hintUsed ? (
              <button
                onClick={handleHint}
                className="flex items-center gap-2 px-3 py-1.5 bg-brand-surface border border-brand-border rounded-full text-brand-muted hover:border-brand-accent hover:text-brand-text transition-colors text-xs"
              >
                💡 תנו לי רמז
              </button>
            ) : (
              <button
                onClick={handleAudio}
                disabled={!data.audio}
                className="flex items-center gap-2 px-3 py-1.5 bg-brand-accent hover:bg-brand-accentHover text-white rounded-full transition-colors text-xs disabled:opacity-40"
              >
                {isPlaying ? "⏹ עצרו" : "▶ השמיעו לי רמז"}
              </button>
            )
          )}
        </div>

        {/* תמונה – מטושטשת עד רמז */}
        <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-brand-border bg-brand-surface relative">
          {data.image ? (
            <Image
              src={data.image}
              alt="שיר"
              fill
              className="object-cover transition-all duration-700"
              style={{ filter: hintUsed ? "blur(0px)" : "blur(8px)", transform: "scale(1.1)" }}
              sizes="80px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🎵</div>
          )}
        </div>
      </div>

      {/* ── שורות השיר ── */}
      <div className="space-y-2">
        {data.lines.map((line, i) => {
          const isVisible = i < linesShown;
          return (
            <div
              key={i}
              className={`
                rounded-xl px-4 py-3 text-sm border transition-all duration-500
                ${isVisible
                  ? "bg-brand-surface border-brand-border text-brand-text"
                  : "bg-brand-surface border-brand-border blur-sm select-none text-brand-muted"}
              `}
              dir="rtl"
            >
              {line}
            </div>
          );
        })}
      </div>

      {/* ── כפתור "הציגו לי עוד שורה" ── */}
      {!finished && linesShown < totalLines && (
        <button
          onClick={showNextLine}
          className="w-full py-2.5 flex items-center justify-center gap-2 bg-brand-accent hover:bg-brand-accentHover text-white rounded-xl text-sm font-medium transition-colors"
        >
          ‹ הציגו לי עוד שורה מהשיר
        </button>
      )}

      {/* ── מונה שלבים ── */}
      <div className="flex items-center justify-center gap-2 flex-row-reverse">
        {Array.from({ length: totalLines }).map((_, i) => (
          <div
            key={i}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all
              ${i < linesShown
                ? "bg-brand-accent border-brand-accent text-white"
                : "bg-brand-surface border-brand-border text-brand-muted"}`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* ── שדה ניחוש ── */}
      {!finished && (
        <div className={`flex gap-2 ${wrong ? "animate-shake" : ""}`}>
          <button
            onClick={check}
            disabled={!input.trim()}
            className="px-5 py-3 bg-brand-accent hover:bg-brand-accentHover disabled:opacity-40 text-white rounded-xl font-medium transition-colors shrink-0"
          >
            ✓
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && check()}
            placeholder="מה שם השיר? כתבו באנגלית בלבד"
            className="flex-1 bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder-brand-muted outline-none focus:border-brand-accent transition-colors text-right"
            dir="rtl"
            autoComplete="off"
          />
        </div>
      )}

      {/* ── תוצאה ── */}
      {finished && (
        <div className="space-y-3">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4 text-sm space-y-1">
            <div>
              <span className="text-brand-muted">השיר: </span>
              <span className="text-brand-text font-bold">{data.songTitle}</span>
            </div>
            <div>
              <span className="text-brand-muted">אמן: </span>
              <span className="text-brand-text">{data.artist}</span>
              <span className="text-brand-muted"> · {data.year}</span>
            </div>
          </div>
          <GameResult solved={won} score={score} shareText={shareText} />
        </div>
      )}
    </div>
  );
}
