import { ReviewTaskNode } from "../models/ReviewTaskNode";
import { ReviewTaskTree } from "../models/ReviewTaskTree";
import { ReviewFlagLabelResolver } from "../services/ReviewFlagLabelResolver";

export class TimetableBuilder {
  constructor(private readonly flagResolver: ReviewFlagLabelResolver) {}

  build(tree: ReviewTaskTree): string {
    const lines = [
      "| 状態 | タイトル | 計画🍅 | 実績✅ | 開始 | 完了 | 備考 |",
      "| --- | --- | --- | --- | --- | --- | --- |",
    ];

    const visit = (node: ReviewTaskNode, depth: number) => {
      lines.push(this.renderRow(node, depth));

      for (const child of node.children) {
        visit(child, depth + 1);
      }
    };

    for (const root of tree.roots) {
      visit(root, 0);
    }

    return lines.join("\n").trim();
  }

  private renderRow(node: ReviewTaskNode, depth: number): string {
    const title = [
      this.formatIndent(depth),
      this.escapeCell(node.title),
    ].join("");

    return [
      "|",
      ` ${this.resolveStatusIcon(node.status ?? undefined)} |`,
      ` ${title} |`,
      ` ${this.formatPomodoro(node.pomodoroPlanned ?? undefined)} |`,
      ` ${this.formatPomodoro(node.pomodoroActual ?? undefined)} |`,
      ` ${this.formatTime(node.started ?? undefined)} |`,
      ` ${this.formatTime(node.completed ?? undefined)} |`,
      ` ${this.formatRemark(node)} |`,
    ].join("");
  }

  private formatRemark(node: ReviewTaskNode): string {
    const parts: string[] = [];

    if (node.goal) {
      parts.push(`🎯${node.goal}`);
    }

    if (node.reviewFlags.length > 0) {
      const labels = node.reviewFlags
        .map((flag) => this.flagResolver.resolve(flag))
        .filter(Boolean)
        .join(", ");

      if (labels) {
        parts.push(`⚠${labels}`);
      }
    }

    if (parts.length === 0) {
      return "";
    }

    return this.escapeCell(parts.join(" / "));
  }

  private resolveStatusIcon(status?: string): string {
    if (status === "completed") return "✅";
    return "";
  }

  private formatIndent(depth: number): string {
    if (depth <= 0) {
      return "";
    }

    return "&nbsp;&nbsp;&nbsp;&nbsp;".repeat(depth);
  }

  private formatTime(value?: string): string {
    if (!value) return "";
    if (/^\d{2}:\d{2}$/.test(value)) return value;

    const date = new Date(value);
    if (isNaN(date.getTime())) return "";

    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  private formatPomodoro(value?: number): string {
    if (!value) {
      return "";
    }

    return (Math.round(value * 10) / 10).toFixed(1);
  }

  private escapeCell(value: string): string {
    return value.replace(/\|/g, "\\|");
  }
}
