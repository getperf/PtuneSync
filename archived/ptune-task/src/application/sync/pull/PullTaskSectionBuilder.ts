import { i18n } from "../../../shared/i18n/I18n";
import { PlannedTaskSectionBuilder } from "../../planning/builders/PlannedTaskSectionBuilder";

export interface PullTaskSectionInput {
  tasksMarkdown: string;
  morningHabits: string[];
  eveningHabits: string[];
  keepExistingHabits: boolean;
}

export class PullTaskSectionBuilder {

  static build(
    input: PullTaskSectionInput,
  ): string {

    return PlannedTaskSectionBuilder.build({
      commentLine1: i18n.common.daily.planned.comment.line1,
      commentLine2: i18n.common.daily.planned.comment.line2,
      tasksMarkdown: input.tasksMarkdown,
      morningHabits: input.morningHabits,
      eveningHabits: input.eveningHabits,
      keepExistingHabits: input.keepExistingHabits,
    });
  }

}