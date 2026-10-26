# Spec 证据工具包

把任务、实际运行记录和验收结论连起来，方便人和 Agent 核对“完成了”具体指什么。[English README](README.md)

本工具使用 Node 26.11.1–26.x，无运行依赖、数据库或模型调用。克隆后即可运行 README 中的离线示例；示例记录全部是虚构格式演示。


**技术文章：** [写了 Spec，为什么还不能说做完了？从工程流程到开源 Evidence Kit](https://hpoenixf.github.io/eff-agent-article/articles/026-agent-spec-evidence-workflow)（[English](https://hpoenixf.github.io/eff-agent-article/en/articles/026-agent-spec-evidence-workflow)）。正文讲清设计来路、开源后的使用方法及验证边界。

## 接入现有项目

```sh
npm install --save-dev github:hpoenixf/openspec-evidence-kit#v0.1.0
npx --no-install spec-evidence lint --change my-change --stage apply
npx --no-install spec-evidence verify --change my-change
npx --no-install spec-evidence verify --change my-change --check
```

默认读取 `openspec/changes/my-change/` 的任务和证据。目录不同可传 `--root`、`--changes-dir`。格式与标签见[证据格式](docs/evidence-format.md)。

- `plan` 阶段允许计划中的工作，检查任务标签。
- `apply` 阶段检查已勾选任务的观测记录及对应文件。
- `verify` 生成可重复的验收视图；`--check` 只检查，不写文件。
- `status` 查看进度与已有完成记录，保留原日期、版本和验证类型。

已有手写验收结论会保留；工具不会因为归档时版本更新就重跑测试。结构检查不能证明命令真的执行、测试足够或答案正确，也不会授予发布权限。历史复用记录与本次观测分别标注。

可选 OpenSpec schema 位于 `schema/evidence-driven/`。采用 MIT 许可，来源与借鉴关系见 [NOTICE](NOTICE.md)。
