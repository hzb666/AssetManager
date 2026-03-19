"""实体配置加载器 - 从 YAML 配置文件加载资产定义"""
import yaml
from pathlib import Path
from typing import Optional, Any

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CONFIG_DIR = BASE_DIR / "config"


class EntityConfig:
    """实体配置管理类"""
    _config: Optional[dict] = None
    _preset: Optional[str] = None

    @classmethod
    def load(cls, preset: str = None) -> dict:
        """加载配置文件"""
        config_path = CONFIG_DIR / "entity.yaml"
        with open(config_path, encoding="utf-8") as f:
            config = yaml.safe_load(f)

        # 加载预设配置
        if preset:
            preset_path = CONFIG_DIR / "presets" / f"{preset}.yaml"
            if preset_path.exists():
                with open(preset_path, encoding="utf-8") as f:
                    preset_config = yaml.safe_load(f)
                    config = cls._merge(config, preset_config)
            cls._preset = preset

        cls._config = config
        return config

    @classmethod
    def _merge(cls, base: dict, override: dict) -> dict:
        """深度合并配置"""
        result = base.copy()
        for key, value in override.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = cls._merge(result[key], value)
            else:
                result[key] = value
        return result

    @classmethod
    def get_config(cls) -> dict:
        """获取当前配置"""
        if cls._config is None:
            cls.load()
        return cls._config

    @classmethod
    def get_entity(cls) -> dict:
        """获取实体基础信息"""
        return cls.get_config().get("entity", {})

    @classmethod
    def get_fields(cls) -> list[dict]:
        """获取字段配置列表"""
        return cls.get_config().get("fields", [])

    @classmethod
    def get_field(cls, key: str) -> Optional[dict]:
        """根据 key 获取字段配置"""
        fields = cls.get_fields()
        return next((f for f in fields if f.get("key") == key), None)

    @classmethod
    def get_label(cls, key: str, lang: str = "zh") -> str:
        """获取字段标签"""
        field = cls.get_field(key)
        if field:
            label_key = "labelEn" if lang == "en" else "label"
            return field.get(label_key, key)
        return key

    @classmethod
    def get_lifecycle_stages(cls) -> list[dict]:
        """获取生命周期阶段列表"""
        lifecycle = cls.get_config().get("lifecycle", {})
        return lifecycle.get("stages", [])

    @classmethod
    def get_enabled_stages(cls) -> list[dict]:
        """获取启用的生命周期阶段"""
        return [s for s in cls.get_lifecycle_stages() if s.get("enabled", True)]

    @classmethod
    def get_rules(cls) -> dict:
        """获取业务规则配置"""
        return cls.get_config().get("rules", {})


# 全局配置实例
entity_config = EntityConfig()
