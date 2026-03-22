export type PromptText = {
  lines: string[];
};

export type PromptDictionary = {
  noteSummary: {
    system: PromptText;
  };
  dailyNotesReflection: {
    system: PromptText;
  };
};
