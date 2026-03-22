import { TagMergePriorityKey } from '../../models/domain/TagMergePriority';
import { TagMergeGroupVM } from './TagMergeGroupVM';

/**
 * TagMergePriorityGroupVM
 *
 * 優先度（high / middle / low / other）ごとのグループ集合。
 * - 本 ViewModel は「表示単位のデータ」を保持する
 * - 表示文言（タブタイトル等）の生成は View 側の責務とする
 */
export type TagMergePriorityGroupVM = {
  /** 優先度キー */
  priority: TagMergePriorityKey;

  /** タブ選択状態（UI 管理用） */
  active: boolean;

  /**
   * to タグ単位のグループ一覧
   * - 件数表示では groups.length を使用する
   * - 0 件の場合も空配列として保持する
   */
  groups: TagMergeGroupVM[];
};
