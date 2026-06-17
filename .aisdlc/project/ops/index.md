---
name: ops-index
description: 运维入口——监控/日志/回滚/发布入口
metadata:
  type: project
  last_updated: 2026-06-17
  evidence_confidence: low
---

# Ops Index

> **规则**: 项目级只写入口链接与最小护栏，详细操作手册归外部平台链接。

## 监控与告警

**Evidence Gaps**: 无监控/告警配置。

- 缺失: 监控 dashboard 链接、告警规则配置、oncall 手册
- 期望粒度: 1 个 dashboard URL + 关键告警规则摘要
- 候选证据位置: 运维平台（Grafana/Prometheus/CloudWatch）、代码中的 metrics 埋点

## 日志入口

**Evidence Gaps**: 无日志系统配置。

- 缺失: 日志聚合平台链接、日志格式规范
- 期望粒度: 1 个日志查询入口 URL
- 候选证据位置: ELK/Splunk/CloudWatch Logs 等日志平台

## 回滚入口

**Evidence Gaps**: 无回滚流程定义。

- 缺失: 回滚 runbook、发布系统入口
- 期望粒度: 1 个可执行回滚命令/按钮 + 判定标准
- 候选证据位置: CI/CD pipeline、发布系统配置

## 发布入口

**Evidence Gaps**: 无发布流程配置。

- 缺失: CI/CD pipeline 定义、环境配置
- 期望粒度: 发布触发方式 + 环境列表
- 候选证据位置: `.github/workflows/`、Jenkinsfile、发布系统配置
