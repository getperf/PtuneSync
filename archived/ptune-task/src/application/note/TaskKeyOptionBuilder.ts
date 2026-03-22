import { TaskKeyService } from "../../infrastructure/conversion/task/tree/TaskKeyService";
import { TaskKeyOption } from "./TaskKeyOption";

export class TaskKeyOptionBuilder {
  build(taskKeys: string[]): TaskKeyOption[] {
    return taskKeys.map((taskKey) => this.buildOption(taskKey));
  }

  private buildOption(taskKey: string): TaskKeyOption {
    const parsed = TaskKeyService.parseCompositeKey(taskKey);

    if (!parsed.parentTitle) {
      return {
        taskKey,
        label: parsed.title,
        suggestedTitle: taskKey,
      };
    }

    return {
      taskKey,
      label: `↳ ${parsed.title}`,
      suggestedTitle: taskKey,
    };
  }
}
