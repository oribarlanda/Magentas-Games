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
  fullAudio?: string;
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
  const [isPlayingFull, setIsPlayingFull] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fullAudioRef = useRef<HTMLAudioElement | null>(null);

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
      setTimeout(() => setShowModal(true), 400);
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

  const handleFullAudio = () => {
    if (!data.fullAudio) return;
    if (!fullAudioRef.current) {
      fullAudioRef.current = new Audio(data.fullAudio);
      fullAudioRef.current.onended = () => setIsPlayingFull(false);
    }
    if (isPlayingFull) {
      fullAudioRef.current.pause();
      fullAudioRef.current.currentTime = 0;
      setIsPlayingFull(false);
    } else {
      fullAudioRef.current.play();
      setIsPlayingFull(true);
    }
  };

  const score = calcScore(100, hintsUsed, totalHints);
  const shareText = `🎵 פתרתי את "איזה שיר"!\nניקוד: ${score}`;

  const songFont: React.CSSProperties = {
    fontFamily: "'Segoe UI', 'Arial', sans-serif",
    fontWeight: 800,
    letterSpacing: "-0.02em",
  };

  return (
    <div className="space-y-6">

      {/* ── Modal ניצחון ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl animate-bounce-in"
            onClick={e => e.stopPropagation()}
          >
            {/* תמונה גדולה */}
            <div className="relative w-full aspect-video bg-gray-100">
              {data.image ? (
                <Image
                  src={data.image}
                  alt={data.songTitle}
                  fill
                  className="object-cover"
                  sizes="400px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">🎵</div>
              )}
            </div>

            {/* מידע */}
            <div className="p-5 space-y-4 text-center">
              <div>
                <p style={{ ...songFont, fontSize: "1.4rem" }} className="text-gray-900">{data.songTitle}</p>
                <p style={{ ...songFont, fontWeight: 400 }} className="text-gray-500 text-base">{data.artist} · {data.year}</p>
              </div>

              {/* נגן שיר מלא */}
              {data.fullAudio && (
                <button
                  onClick={handleFullAudio}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-brand-accent hover:bg-brand-accentHover text-white rounded-2xl font-medium text-sm transition-colors"
                >
                  {isPlayingFull ? "⏹ עצרו את השיר" : "▶ נגנו את השיר המלא"}
                </button>
              )}

              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 border border-gray-200 rounded-2xl text-gray-500 text-sm hover:bg-gray-50 transition-colors"
              >
                חזרה למשחק
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex gap-4 items-start" dir="rtl">
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

        <div className="flex-1 space-y-1 pt-1">
          <div
            style={songFont}
            className={`text-lg leading-tight transition-all duration-500 ${finished ? "text-brand-text" : "blur-sm select-none text-brand-muted"}`}
          >
            {data.songTitle}
          </div>
          <div
            style={songFont}
            className={`text-base leading-tight transition-all duration-500 ${hintUsed || finished ? "text-brand-text" : "blur-sm select-none text-brand-muted"}`}
          >
            {data.artist}, {data.year}
          </div>

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
                color: isVisible ? "#2D2D2D" : "#8B8FA8",
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
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-accent hover:bg-brand-accentHover text-white rounded-full transition-colors text-xs font-medium"
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
        <div className={`space-y-2 ${wrong ? "animate-shake" : ""}`} dir="rtl">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && check()}
            placeholder="מה שם השיר?"
            className="w-full bg-brand-surface border border-brand-border rounded-2xl px-4 py-3 text-brand-text placeholder-brand-muted outline-none focus:border-brand-accent transition-colors text-right text-sm"
            dir="rtl"
            autoComplete="off"
          />
          <button
            onClick={check}
            disabled={!input.trim()}
            className="w-full py-3 bg-brand-accent hover:bg-brand-accentHover disabled:opacity-40 text-white rounded-2xl font-bold text-sm transition-colors"
          >
            בדיקה ✓
          </button>
        </div>
      )}

      {/* ── תוצאה ── */}
      {finished && (
        <div className="space-y-3">
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-2.5 bg-brand-surface border border-brand-border rounded-2xl text-brand-muted text-sm hover:border-brand-accent hover:text-brand-text transition-colors"
          >
            🎵 הצגת השיר המלא
          </button>
          <GameResult solved={won} score={score} shareText={shareText} />
        </div>
      )}
    </div>
  );
}
