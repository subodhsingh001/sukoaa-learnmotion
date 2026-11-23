import curriculum from "./curriculum.json";
export type CurriculumChapter = {board:string;classLevel:number;subject:string;chapterNumber:number;chapterTitle:string;lessonSlug:string|null;status:string;enrichment?:boolean};
export const curriculumChapters = curriculum as CurriculumChapter[];
export const curriculumBoards = ["CBSE/NCERT", "ICSE/ISC"] as const;
