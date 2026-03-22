/**
 * IProgressReporter
 * - LLMタグ生成処理の進行状況を UI 側へ通知するためのインターフェース。
 * - Runner（処理ロジック）と Modal（UIロジック）の依存を切り離す。
 */
import { TFile } from 'obsidian';

export interface IProgressReporter {
  /** 全体件数が確定した時点で呼び出される */
  onStart(total: number): void;

  /** 個別ファイルの処理開始時に呼び出される */
  onProgress(index: number, file: TFile): void;

  /** 全ファイル処理後に呼び出される */
  onFinish(success: number, errors: number): void;

  /** Analysis フェーズの完了通知（開始通知は不要） */
  onPhaseDone(name: string): void;
}
