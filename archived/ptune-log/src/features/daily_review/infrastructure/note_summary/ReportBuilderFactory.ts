// src/features/daily_review/services/note_summary/ReportBuilderFactory.ts

import { OutlinerReportBuilder } from './builders/OutlinerReportBuilder';
import { ReportBuilder } from '../../domain/ports/ReportBuilder';
import { XMindReportBuilder } from './builders/XMindReportBuilder';

export type OutputFormat = 'outliner' | 'xmind';

export class ReportBuilderFactory {
  static create(format: OutputFormat): ReportBuilder {
    switch (format) {
      case 'xmind':
        return new XMindReportBuilder();
      case 'outliner':
      default:
        return new OutlinerReportBuilder();
    }
  }
}
