// src/core/models/daily_notes/SectionList.ts

import { Section } from './Section';

export class SectionList {
  readonly sections: readonly Section[];

  constructor(items: Section[] = []) {
    this.sections = items;
  }

  isEmpty(): boolean {
    return this.sections.length === 0;
  }

  count(): number {
    return this.sections.length;
  }

  /** present なものだけ数える（再実行耐性） */
  presentCount(): number {
    return this.sections.filter((s) => s.present).length;
  }

  append(section: Section): SectionList {
    return new SectionList([...this.sections, section]);
  }

  prepend(section: Section): SectionList {
    return new SectionList([section, ...this.sections]);
  }

  insert(section: Section, position: 'first' | 'last' = 'last'): SectionList {
    return position === 'first' ? this.prepend(section) : this.append(section);
  }

  map(fn: (s: Section) => Section): SectionList {
    return new SectionList(this.sections.map(fn));
  }
}
