import type { TFolder } from 'obsidian';
import type { TagCandidate } from 'src/core/models/tags/TagCandidate';

export interface ITagSuggestionStrategy {
  suggestTags(folder: TFolder): Promise<TagCandidate[]>;
}
