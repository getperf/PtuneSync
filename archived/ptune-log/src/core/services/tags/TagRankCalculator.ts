// core/services/tags/TagRankCalculator.ts
import { Vault } from 'obsidian';
import { TagKindRegistry } from 'src/core/models/tags/TagKindRegistry';
import { TagYamlIO } from 'src/core/services/yaml/TagYamlIO';

export type TagRank = {
  kindId: string;
  kindLabel: string;
  tags: { name: string; count: number }[];
};

export class TagRankCalculator {
  constructor(
    private readonly registry: TagKindRegistry,
    private readonly tagYamlIO: TagYamlIO
  ) { }

  async calculateTop(vault: Vault, limit = 30): Promise<TagRank[]> {
    const tags = await this.tagYamlIO.load(vault);
    const result: TagRank[] = [];

    for (const kind of this.registry.getAll()) {
      const rows = tags
        .filter((r) => r.tagKind === kind.id && r.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map((r) => ({ name: r.name, count: r.count }));

      if (rows.length === 0) continue;

      result.push({
        kindId: kind.id,
        kindLabel: kind.label,
        tags: rows,
      });
    }
    return result;
  }
}
