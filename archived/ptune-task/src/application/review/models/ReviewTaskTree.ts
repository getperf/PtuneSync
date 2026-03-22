import { ReviewTaskDto } from "../dto/ReviewTaskDto";
import { ReviewTaskNode } from "./ReviewTaskNode";

export class ReviewTaskTree {
  constructor(public readonly roots: ReviewTaskNode[]) {}

  static fromDtos(dtos: ReviewTaskDto[]): ReviewTaskTree {
    const nodeMap = new Map<string, ReviewTaskNode>();

    // 1) ノード生成（children は後で接続）
    for (const dto of dtos) {
      nodeMap.set(
        dto.id,
        new ReviewTaskNode({
          id: dto.id,
          title: dto.title,
          status: dto.status ?? null,
          pomodoroPlanned: dto.pomodoro_planned ?? null,
          pomodoroActual: dto.pomodoro_actual ?? null,
          started: dto.started ?? null,
          completed: dto.completed ?? null,
          tags: dto.tags ?? [],
          goal: dto.goal ?? null,
          reviewFlags: dto.review_flags ?? [],
          children: [],
        }),
      );
    }

    // 2) 親子接続（入力配列の順序を保持）
    const roots: ReviewTaskNode[] = [];
    for (const dto of dtos) {
      const node = nodeMap.get(dto.id);
      if (!node) continue;

      const parentId = dto.parent ?? null;
      if (parentId && nodeMap.has(parentId)) {
        nodeMap.get(parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return new ReviewTaskTree(roots);
  }

  flatten(): ReviewTaskNode[] {
    const out: ReviewTaskNode[] = [];
    const visit = (n: ReviewTaskNode) => {
      out.push(n);
      n.children.forEach(visit);
    };
    this.roots.forEach(visit);
    return out;
  }

  unfinishedNodes(): ReviewTaskNode[] {
    return this.flatten().filter((n) => n.isUnfinished());
  }

  /**
   * tags 別の pomodoroActual 合計（子孫は含めない＝各行の実績の合算）
   * ※「親に子孫分も含める」集計にしたい場合はここで totalPomodoroActual を使う方針へ。
   */
  aggregatePomodoroByTag(): Map<string, { planned: number; actual: number }> {
    const map = new Map<string, { planned: number; actual: number }>();

    for (const node of this.flatten()) {
      const planned = node.pomodoroPlanned ?? 0;
      const actual = node.pomodoroActual ?? 0;

      // ★ tag無しは Etc 扱い
      const tags = node.tags.length > 0 ? node.tags : ["Etc"];

      for (const tag of tags) {
        const current = map.get(tag) ?? { planned: 0, actual: 0 };

        map.set(tag, {
          planned: current.planned + planned,
          actual: current.actual + actual,
        });
      }
    }

    return map;
  }
}
