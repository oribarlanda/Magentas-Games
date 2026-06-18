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
  const [linesShown, setLinesShown] = useState(1);
  const [hintUsed, setHintUsed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [won, setWon] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const totalLines = data.lines.length;
  const hintsUsed = (linesShown - 1) + (hintUsed ? 1 : 0);
  const totalHints = totalLines - 1 + 1;

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
      if (linesShown < totalLines) setLinesShown(s => s + 1);
    }
    setInput("");
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

  const score = calcScore(100, hintsUsed, totalHints);
  const shareText = `🎵 פתרתי את "איזה שיר"!\nניקוד: ${score}`;

  // סגנון פונט לכל טקסט של השיר
  const songFont: React.CSSProperties = {
    fontFamily: "'Segoe UI', 'Arial', sans-serif",
    fontWeight: 800,
    letterSpacing: "-0.02em",
  };

  return (
    <div className="space-y-6">

      {/* ── Header: תמונה מימין + מידע משמאל ── */}
      <div className="flex gap-4 items-start" dir="rtl">

        {/* תמונה – מימין, מטושטשת עד רמז */}
        <div className="shrink-0 w-24 h-24 rounded-2xl overflow-hidden bg-brand-surface relative shadow-lg">
          {data.image ? (
            <Image
              src={data.image}
              alt="שיר"
              fill
              className="object-cover transition-all duration-700"
              style={{ filter: hintUsed || finished ? "blur(0px)" : "blur(10px)", transform: "scale(1.15)" }}
              sizes="96px"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl bg-brand-surface">🎵</div>
          )}
        </div>

        {/* מידע – משמאל לתמונה */}
        <div className="flex-1 space-y-1 pt-1">
          {/* שם השיר – מטושטש עד פתרון */}
          <div
            style={songFont}
            className={`text-lg leading-tight transition-all duration-500 ${finished ? "text-brand-text" : "blur-sm select-none text-brand-muted"}`}
          >
            {data.songTitle}
          </div>

          {/* אמן + שנה – מטושטש עד רמז */}
          <div
            style={songFont}
            className={`text-base leading-tight transition-all duration-500 ${hintUsed || finished ? "text-brand-text" : "blur-sm select-none text-brand-muted"}`}
          >
            {data.artist}, {data.year}
          </div>

          {/* כפתור רמז / השמע */}
          {!finished && (
            <div className="pt-1">
              {!hintUsed ? (
                <button
                  onClick={() => setHintUsed(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-surface border border-brand-border rounded-full text-brand-muted hover:border-brand-accent hover:text-brand-text transition-colors text-xs font-medium"
                >
                  💡 תנו לי רמז
                </button>
              ) : (
                <button
                  onClick={handleAudio}
                  disabled={!data.audio}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-accent hover:bg-brand-accentHover text-white rounded-full transition-colors text-xs font-medium disabled:opacity-40"
                >
                  {isPlaying ? "⏹ עצרו" : "▶ השמיעו לי רמז"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── שורות השיר ── */}
      <div className="space-y-1" dir="rtl">
        {data.lines.map((line, i) => {
          const isVisible = i < linesShown;
          return (
            <p
              key={i}
              style={{
                ...songFont,
                fontSize: "1.35rem",
                lineHeight: "1.6",
                filter: isVisible ? "blur(0px)" : "blur(6px)",
                userSelect: isVisible ? "auto" : "none",
                transition: "filter 0.5s ease",
                color: isVisible ? "var(--color-brand-text, #E8E9F0)" : "#8B8FA8",
              }}
            >
              {line}
            </p>
          );
        })}
      </div>

      {/* ── כפתור "הציגו עוד שורה" ── */}
      {!finished && linesShown < totalLines && (
        <button
          onClick={() => setLinesShown(s => s + 1)}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-accent hover:bg-brand-accentHover text-white rounded-full text-sm font-bold transition-colors"
          style={songFont}
        >
          ‹ הציגו לי עוד שורה מהשיר
        </button>
      )}

      {/* ── מונה שלבים ── */}
      <div className="flex items-center gap-2 flex-row-reverse justify-end">
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
        <div className={`flex gap-2 ${wrong ? "animate-shake" : ""}`} dir="rtl">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && check()}
            placeholder="מה שם השיר?"
            className="flex-1 bg-brand-surface border border-brand-border rounded-2xl px-4 py-3 text-brand-text placeholder-brand-muted outline-none focus:border-brand-accent transition-colors text-right text-sm"
            dir="rtl"
            autoComplete="off"
          />
          <button
            onClick={check}
            disabled={!input.trim()}
            className="w-10 h-12 bg-brand-surface border border-brand-border rounded-2xl flex items-center justify-center text-brand-muted hover:border-brand-accent hover:text-brand-text transition-colors disabled:opacity-40 shrink-0"
          >
            ‹
          </button>
        </div>
      )}

      {/* ── תוצאה ── */}
      {finished && (
        <div className="space-y-3">
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 space-y-0.5" dir="rtl">
            <p style={{ ...songFont, fontSize: "1.1rem" }} className="text-brand-text">{data.songTitle}</p>
            <p style={{ ...songFont, fontWeight: 400 }} className="text-brand-muted text-sm">{data.artist} · {data.year}</p>
          </div>
          <GameResult solved={won} score={score} shareText={shareText} />
        </div>
      )}
    </div>
  );
}
