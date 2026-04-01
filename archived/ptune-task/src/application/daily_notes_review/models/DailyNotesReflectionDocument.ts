export type ReflectionSentence = {
  text: string;
};

export type ReflectionNote = {
  noteTitle: string;
  sentences: ReflectionSentence[];
};

export type ReflectionProject = {
  projectTitle: string;
  notes: ReflectionNote[];
};

export class DailyNotesReflectionDocument {
  constructor(
    readonly projects: ReflectionProject[],
  ) {}
}
