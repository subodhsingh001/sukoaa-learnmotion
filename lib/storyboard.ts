export type Scene = {
  template: "title_card" | "bullets" | "number_line" | "force_diagram" | "orbit" | "cycle" | "formula" | "atom3d" | "shape3d";
  params: Record<string, unknown>;
  narration: string;
  seconds: number;
};
export type Storyboard = { format: "storyboard_v1"; title: string; language: "en" | "hi" | "bn"; scenes: Scene[] };

export function parseStoryboard(body: string): Storyboard | null {
  try {
    const d = JSON.parse(body);
    return d && d.format === "storyboard_v1" && Array.isArray(d.scenes) && d.scenes.length ? d : null;
  } catch { return null; }
}
export const SPEECH_LANG = { en: "en-IN", hi: "hi-IN", bn: "bn-IN" } as const;
