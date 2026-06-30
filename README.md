# 2026专项工程进度看板

这个文件夹可以直接作为 GitHub Pages 静态站点发布。

## 文件

- `index.html`：可发布的网页。
- `project-data.json`：从三个 Excel 文件整合出的结构化数据，便于核对。

## 推荐更新方式

1. 继续维护原来的三个 Excel 文件。
2. 表格有更新时，把最新版本发给 Codex，或放到同一个 GitHub 仓库的 `data/` 文件夹。
3. 重新运行生成脚本，覆盖 `index.html` 和 `project-data.json`。
4. 提交到 GitHub 后，GitHub Pages 会自动展示最新页面。

## GitHub Pages 发布

把本文件夹内容放到一个公开仓库的根目录，或放到 `docs/` 目录，然后在 GitHub 仓库设置里开启 Pages：

- Source 选择 `Deploy from a branch`
- Branch 选择 `main`
- Folder 选择 `/root` 或 `/docs`

公开链接通常是：

`https://用户名.github.io/仓库名/`
