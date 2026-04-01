import { DEV_SYSTEM_PROMPT, DEV_USER_PROMPT } from './templates/dev_template';
import {
  GENERAL_SYSTEM_PROMPT,
  GENERAL_USER_PROMPT,
} from './templates/general_template';
import {
  JOURNAL_SYSTEM_PROMPT,
  JOURNAL_USER_PROMPT,
} from './templates/journal_template';
import {
  RESEARCH_SYSTEM_PROMPT,
  RESEARCH_USER_PROMPT,
} from './templates/research_template';

// ... 他テンプレートも分割

export interface PromptTemplateEntry {
  id: string;
  title: string;
  system: string;
  user: string;
}

const templates: PromptTemplateEntry[] = [
  {
    id: 'prompt_general',
    title: '標準',
    system: GENERAL_SYSTEM_PROMPT,
    user: GENERAL_USER_PROMPT,
  },
  {
    id: 'prompt_dev',
    title: '開発ノート',
    system: DEV_SYSTEM_PROMPT,
    user: DEV_USER_PROMPT,
  },
  {
    id: 'prompt_journal',
    title: '日記ログ',
    system: JOURNAL_SYSTEM_PROMPT,
    user: JOURNAL_USER_PROMPT,
  },
  {
    id: 'prompt_research',
    title: '研究メモ',
    system: RESEARCH_SYSTEM_PROMPT,
    user: RESEARCH_USER_PROMPT,
  },
];

export class PromptTemplate {
  static getTitles(): Map<string, string> {
    return new Map(templates.map((t) => [t.id, t.title]));
  }

  static getSystem(id: string): string | undefined {
    return templates.find((t) => t.id === id)?.system;
  }

  static getUser(id: string): string | undefined {
    return templates.find((t) => t.id === id)?.user;
  }

  static getMerged(id: string): string | undefined {
    const tpl = templates.find((t) => t.id === id);
    return tpl ? `${tpl.system}\n\n${tpl.user}` : undefined;
  }

  static getTemplate(id: string): PromptTemplateEntry | undefined {
    return templates.find((t) => t.id === id);
  }

  static getAll(): PromptTemplateEntry[] {
    return templates;
  }
}
