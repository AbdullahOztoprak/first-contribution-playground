<h1 align="center">🎮 First Contribution Playground</h1>
<p align="center">
  <strong>面向初级开发者的开源练习场</strong>
</p>
<p align="center">
  提交游戏 · 赚取 XP · 收集徽章 · 打造你的作品集
</p>
<p align="center">
  <a href="https://abdullahoztoprak.github.io/first-contribution-playground">🌐 在线站点</a> •
  <a href="#-快速开始">快速开始</a> •
  <a href="#-如何贡献">贡献方式</a> •
  <a href="#-游戏化机制">游戏化机制</a> •
  <a href="../../CONTRIBUTING.md">贡献指南</a>
</p>
<p align="center">
  <img src="https://img.shields.io/github/stars/AbdullahOztoprak/first-contribution-playground?style=flat-square" alt="Star 数">
  <img src="https://img.shields.io/github/forks/AbdullahOztoprak/first-contribution-playground?style=flat-square" alt="Fork 数">
  <img src="https://img.shields.io/github/contributors/AbdullahOztoprak/first-contribution-playground?style=flat-square" alt="贡献者数">
</p>

---

## 🚀 什么是 First Contribution Playground？

**First Contribution Playground** 是一个基于 GitHub 的社区，帮助初级开发者通过以下方式完成自己的第一次开源贡献：

- 🎮 **提交简单游戏** - CLI、网页或算法类游戏
- 🌍 **参与翻译** - 帮助我们服务全球开发者
- 🏆 **参与排行榜竞争** - 社区每周通过投票评选最佳游戏
- 📊 **积累 GitHub 贡献记录** - 每个合并的 PR 都会出现在你的个人主页
- 🎓 **学习真实协作流程** - PR、代码评审、CI/CD 和自动化

> **每位专家都曾是初学者。** 这里就是你开源之旅的起点。

---

## 📁 仓库结构

```
First Contribution Playground/
├── games/
│   ├── cli/              # 终端游戏
│   ├── web/              # 浏览器游戏
│   └── algorithm/        # 算法谜题与挑战
├── translations/
│   ├── README/           # README 翻译
│   ├── CONTRIBUTING/     # 贡献指南翻译
│   └── guides/           # 指南文档翻译
├── data/                 # 生成的数据文件 + schema.ts
├── scripts/              # 构建与校验脚本
├── web/                  # Astro 网站平台
│   ├── src/pages/        # 页面（游戏、排行榜、个人资料）
│   └── src/components/   # 可复用组件
├── docs/                 # 文档与指南
├── .github/
│   └── workflows/        # CI/CD 自动化（4 个工作流）
├── CONTRIBUTING.md        # 贡献指南
├── CODE_OF_CONDUCT.md     # 行为准则
└── README.md              # 你当前看到的文件
```

---

## ⚡ 快速开始

### 🎮 提交一个游戏

1. **Fork** 这个仓库
2. **创建分支**：`git checkout -b game/your-game-name`
3. 在 `games/<category>/your-game-name/` 中**添加你的游戏**
4. **至少包含以下文件：**
   - `README.md` - 游戏玩法说明，以及你学到了什么
   - `metadata.json` - 游戏信息（[模板](../../CONTRIBUTING.md#metadatajson-template)）
   - 你的源代码（最多 5 个文件，总计最多 500 行）
5. 使用 [Game Submission 模板](../../.github/PULL_REQUEST_TEMPLATE/game_submission.md) **发起 PR**
6. **等待评审** - 机器人会自动进行校验

### 🌍 提交一个翻译

1. **Fork** 这个仓库
2. **创建分支**：`git checkout -b translation/lang-code`
3. 按 `FILENAME.LANG_CODE.md` 的格式，将翻译文件添加到 `translations/` 对应目录
4. 使用 [Translation 模板](../../.github/PULL_REQUEST_TEMPLATE/translation_submission.md) **发起 PR**
5. **自动合并** - 只要所有检查通过，翻译 PR 会自动合并

---

## 🎮 精选游戏

### CLI 游戏
|------|--------|----------|------------|
| [Number Guessing](../../games/cli/example-number-guessing/) | @platform-bot | Python | Beginner |

| 游戏 | 作者 | 语言 | 难度 |
|------|--------|----------|------------|
| [Rock Paper Scissors](../../games/web/example-rock-paper-scissors/) | @platform-bot | HTML/CSS/JS | Beginner |
➡️ *想在这里看到你的游戏吗？[现在就提交！](https://github.com/AbdullahOztoprak/first-contribution-playground/issues/new?template=game-submission.yml)*

---
## 🏆 排行榜

<!-- LEADERBOARD:WEEKLY:START -->

*本周还没有游戏提交。来当第一个吧！*
<!-- LEADERBOARD:WEEKLY:END -->

<!-- LEADERBOARD:CONTRIBUTORS:START -->
### 🌟 顶级贡献者（总榜）

| 排名 | 贡献者 | 贡献数 |
|------|------------|---------------|
| 🥇 | [@AbdullahOztoprak](https://github.com/AbdullahOztoprak) | 8 |

<!-- LEADERBOARD:CONTRIBUTORS:END -->

<!-- LEADERBOARD:TIMESTAMP:START -->
*最后更新：Sun, 08 Mar 2026 12:06:01 GMT*
<!-- LEADERBOARD:TIMESTAMP:END -->

> 💡 **投票规则：** 在游戏 PR 上添加 👍 表情即可投票！每周排名前 3 的游戏会被展示。

---

## 🏅 荣誉殿堂

特别表彰表现突出的贡献者：
| 徽章 | 条件 | 获得者 |
|-------|----------|------------|
| 🥇 **First Contributor** | 首个合并的 PR | — |
| 🎮 **Game Master** | 提交 5 个以上游戏 | — |
| 🌍 **Translation Champion** | 提交 3 个以上翻译 | — |
| ⭐ **Weekly Champion** | 周榜第 1 名 | — |
| 🔥 **Streak Hero** | 连续 4 周持续贡献 | — |
| 🐛 **Bug Hunter** | 发现并报告了重要 Bug | — |

---

## 🤖 自动化

这个项目由 4 个整合后的 GitHub Actions 工作流驱动，实现了完整自动化：

| 工作流 | 触发时机 | 作用 |
|----------|---------|--------------|
| **CI Pipeline** | PR 打开或更新时 | 检测类型、执行校验、Lint 和安全扫描 |
| **Deploy** | 推送到 main 时 | 构建数据索引并部署网站 |
| **Community** | PR/Issue 事件 | 欢迎机器人、反垃圾、过期管理 |
| **Leaderboard** | 每周（日） | 计算带 XP 权重的排名 |

**生成的数据文件**

规范生成的文件（`data/games.json`、`data/contributors.json`、`data/leaderboard.json`）会根据源内容自动生成，并由自动化在 `main` 分支上更新。贡献者不应在功能分支中提交这些文件的改动，否则自动化检查会阻止 PR 通过。如果你只是想在本地预览生成结果，可以运行 `npm run build:data`，但不要提交生成后的变更。

---

## 🎮 游戏化机制

### XP 奖励
| 操作 | 获得 XP |
|--------|-----------|
| 首次贡献 | +50 |
| 游戏被合并 | +100 |
| 翻译被合并 | +30 |
| 评审了一个 PR | +20 |
| 收到一个 👍 投票 | +5 |
| 周榜第 1 | +200 |
| 周榜第 2 | +100 |
| 周榜第 3 | +50 |

### 难度倍率
- 🟢 **Beginner 游戏**：1.0x 积分
- 🟡 **Intermediate 游戏**：1.5x 积分
- 🔴 **Advanced 游戏**：2.0x 积分

### 等级
| 等级 | 所需 XP | 称号 |
|-------|-------------|-------|
| 1 | 0 | 新人 |
| 2 | 100 | 贡献者 |
| 3 | 300 | 活跃成员 |
| 4 | 600 | 专家 |
| 5 | 1000+ | 大师 |

### 徽章
🎮 **Game Master**（5+ 游戏） • 🌍 **Translator**（3+ 翻译） • ⭐ **Champion**（周榜第 1） • 🔥 **Streak Hero**（连续 4 周） • 👀 **Reviewer**（10+ 次评审） • 💎 **OG**（前 10 位贡献者）

---

## 🌍 可用翻译

| 语言 | README | 贡献指南 | 新手指南 |
|----------|--------|-------------|-----------------|
| 🇬🇧 English | ✅ | ✅ | ✅ |
| 🇹🇷 Turkish | ❌ 需要帮助！ | ❌ | ❌ |
| 🇪🇸 Spanish | ❌ 需要帮助！ | ❌ | ❌ |
| 🇫🇷 French | ❌ 需要帮助！ | ❌ | ❌ |
| 🇩🇪 German | ❌ 需要帮助！ | ❌ | ❌ |
| 🇯🇵 Japanese | ❌ 需要帮助！ | ❌ | ❌ |
| 🇧🇷 Portuguese | ❌ 需要帮助！ | ❌ | ❌ |

➡️ *选一种语言，然后[开始翻译吧！](https://github.com/AbdullahOztoprak/first-contribution-playground/issues/new?template=translation.yml)*

---

## 📖 文档

- 📋 [贡献指南](../../CONTRIBUTING.md) - 规则、模板和流程
- 📖 [Beginner's Guide](../../docs/BEGINNER_GUIDE.md) - 面向初次贡献者的分步说明
- 🔒 [安全策略](../../SECURITY.md) - 我们如何保障提交安全
- 📜 [行为准则](../../CODE_OF_CONDUCT.md) - 社区规范
- 🗺️ [路线图](../../docs/ROADMAP.md) - 后续计划

---

## 🛡️ 安全

我们非常重视安全性。游戏提交会经过以下检查：

- ✅ 扫描危险函数（`eval`、`exec`、`subprocess` 等）
- ✅ 检查是否尝试网络访问
- ✅ 校验是否只使用允许的文件类型
- ✅ 限制每次提交最多 5 个文件、500 行代码
- ✅ 在合并前由维护者进行审查

完整细节见我们的[安全策略](../../SECURITY.md)。

---

## 🗺️ 路线图

- [x] 仓库核心结构
- [x] GitHub Actions 自动化
- [x] 游戏化与排行榜系统
- [x] 反垃圾与安全防护
- [x] 用于浏览游戏的 Web 前端界面
- [ ] 贡献者个人主页与徽章（部分完成）
- [ ] 游戏元数据 API
- [ ] 托管式游戏游乐场（在浏览器中试玩游戏）
- [ ] 每月社区挑战
- [ ] 与 Discord/Slack 集成

更多细节请查看完整的[路线图](../../docs/ROADMAP.md)。

---

## ⭐ 给仓库点个 Star

如果你觉得这个项目有用，请给这个仓库点个 ⭐ Star！这有助于让更多人发现 First Contribution Playground。

---

## 📄 许可证

本项目使用 [MIT License](../../LICENSE) 授权。

---

<p align="center">
  <strong>为开源社区用心打造</strong>
  <br>
  <sub>每一份贡献都很重要。现在就开始你的旅程。</sub>
</p>
