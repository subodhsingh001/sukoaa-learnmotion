export type Asset = { id: number; kind: string; title: string; body: string; status: string };
export type Chapter = {
  id: number; number: number; title: string; status: string;
  printed_start: number | null; printed_end: number | null; pdf_offset: number | null;
  source_available: boolean; source_text: string; assets: Asset[];
};
export type BookMeta = { title: string; grade: number; subject: string; board: string };
export type Question = { question: string; answer: string; options: string[]; correct_option: number | null; explanation: string };
export const blankQuestion = (): Question => ({ question: "", answer: "", options: ["", "", "", ""], correct_option: null, explanation: "" });
