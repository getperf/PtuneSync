# src/ptune_sync/domain/versioning.py
from __future__ import annotations

from typing import Dict, Any


class VersionManager:
    """
    スキーマバージョンの唯一の管理ポイント。

    - JSON保存時の schema_version
    - SQLiteスキーマバージョン
    - 将来のマイグレーション入口

    すべてここに集約する。
    """

    CURRENT_VERSION: int = 3  # tags / goal 追加に伴い v2 へ

    # ==========================================================
    # JSON 用
    # ==========================================================

    @classmethod
    def inject_version(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        JSONルートに schema_version を付与。
        """
        payload["schema_version"] = cls.CURRENT_VERSION
        return payload

    @classmethod
    def get_json_version(cls, data: Dict[str, Any]) -> int:
        """
        JSONから version を取得（未定義は v1 扱い）。
        """
        return int(data.get("schema_version", 1))

    # ==========================================================
    # 将来拡張用（JSONマイグレーション入口）
    # ==========================================================

    @classmethod
    def migrate_json_if_needed(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        version = cls.get_json_version(data)

        if version == cls.CURRENT_VERSION:
            return data

        # 将来ここに段階的マイグレーションを書く
        # 例:
        # if version == 1:
        #     data = cls._migrate_v1_to_v2(data)
        #     version = 2

        data["schema_version"] = cls.CURRENT_VERSION
        return data
