// src/features/daily_review/services/note_summary/ReportBuilder.ts

import { NoteSummaryDocument } from '../models/NoteSummaryDocument';

export interface ReportBuilder {
  build(doc: NoteSummaryDocument): string;
}
