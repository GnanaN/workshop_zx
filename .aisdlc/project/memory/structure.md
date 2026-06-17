---
name: structure
description: 项目结构、运行/验证/发布入口
metadata:
  type: project
  last_updated: 2026-06-17
  evidence_confidence: low
---

# Structure

## 项目概览

- **仓库名**: workshop_zx
- **定位**: AI 协助的产研全流程体验（workshop 项目）
- **当前状态**: 初始化阶段，无业务代码
- **分支策略**: 仅 main 分支，无其他活跃分支
- **提交历史**: 仅 1 个 commit（Initial commit）

## 如何运行

**Evidence Gaps**: 项目尚无任何可运行代码、构建脚本、或运行时配置。

- 缺失: 运行时入口（`package.json`、`main.go`、`app.py` 等）
- 期望粒度: 一个 `npm start` / `go run` / `python app.py` 级别的启动命令
- 候选证据位置: 仓库根目录，等待首次代码提交

## 如何验证

**Evidence Gaps**: 项目尚无测试框架、CI 配置、或验证脚本。

- 缺失: 测试运行器、lint 配置、CI pipeline
- 期望粒度: `npm test` / `go test` 级别验证命令
- 候选证据位置: 仓库根目录或 `.github/workflows/`

## 如何发布

**Evidence Gaps**: 项目尚无部署/发布相关配置。

- 缺失: Dockerfile、CI/CD pipeline、部署清单
- 期望粒度: 一个可重复的发布流程描述
- 候选证据位置: 仓库根目录或 CI 配置目录
