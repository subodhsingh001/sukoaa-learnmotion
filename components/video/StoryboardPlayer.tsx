"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { SPEECH_LANG, type Storyboard } from "@/lib/storyboard";
import { Button } from "@/components/ui/kit";
import SceneView from "./scenes";

export default function StoryboardPlayer({ storyboard }: { storyboard: Storyboard }) {
  const { scenes } = storyboard;
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [finished, setFinished] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
  const scene = scenes[idx];

  // Play one scene: narrate it and move on when both the narration and the minimum scene time are done.
  useEffect(() => {
    if (!playing) return;
    let cancelled = false, timeDone = false, speechDone = muted || !canSpeak;
    const next = () => {
      if (cancelled || !timeDone || !speechDone) return;
      if (idx + 1 < scenes.length) setIdx(idx + 1); else { setPlaying(false); setFinished(true); }
    };
    const timer = window.setTimeout(() => { timeDone = true; next(); }, scene.seconds * 1000);
    if (!muted && canSpeak) {
      const u = new SpeechSynthesisUtterance(scene.narration);
      u.lang = SPEECH_LANG[storyboard.language] ?? "en-IN";
      u.rate = 0.95;
      u.onend = u.onerror = () => { speechDone = true; next(); };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
    return () => { cancelled = true; window.clearTimeout(timer); if (canSpeak) window.speechSynthesis.cancel(); };
  }, [playing, idx, muted, canSpeak, scene, scenes.length, storyboard.language]);

  useEffect(() => () => { if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);

  const go = useCallback((i: number) => { setIdx(Math.max(0, Math.min(scenes.length - 1, i))); setFinished(false); }, [scenes.length]);
  const toggle = () => { if (finished) { setIdx(0); setFinished(false); } setPlaying((p) => !p); };
  const fullscreen = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void stage.current?.requestFullscreen?.(); };

  return (
    <div>
      <div className="sk-stage" ref={stage}>
        <div className="sk-scene" key={idx}><SceneView scene={scene} playing={playing} /></div>
        <div className="sk-caption" aria-live="polite">{scene.narration}</div>
        {!playing && <button className="sk-play-overlay" onClick={toggle} aria-label={finished ? "Replay lesson" : "Play lesson"}><span>{finished ? <RotateCcw size={34} /> : <Play size={36} fill="#fff" />}</span></button>}
      </div>
      <div className="sk-controls">
        <Button size="sm" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="Previous scene"><SkipBack size={15} /></Button>
        <Button size="sm" variant="primary" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause size={15} /> : <Play size={15} />}{playing ? "Pause" : "Play"}</Button>
        <Button size="sm" onClick={() => go(idx + 1)} disabled={idx === scenes.length - 1} aria-label="Next scene"><SkipForward size={15} /></Button>
        <div className="sk-segments" role="group" aria-label="Scenes">{scenes.map((_, i) => <button key={i} aria-label={`Scene ${i + 1}`} data-state={i < idx ? "done" : i === idx ? "now" : ""} onClick={() => go(i)} />)}</div>
        <span style={{ fontSize: 12.5, color: "var(--sk-muted)" }}>{idx + 1} / {scenes.length}</span>
        {canSpeak && <Button size="sm" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Turn narration on" : "Mute narration"}>{muted ? <VolumeX size={15} /> : <Volume2 size={15} />}</Button>}
        <Button size="sm" onClick={fullscreen} aria-label="Full screen"><Maximize2 size={15} /></Button>
      </div>
    </div>
  );
}
