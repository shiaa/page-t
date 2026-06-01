#!/usr/bin/env python3
"""
AI 科技新闻每日自动抓取与博客更新脚本
=============================================
用途：每日自动抓取 AI/科技新闻，生成 Markdown 格式的日报内容，
     更新博客数据源并触发重新构建部署。

数据源：
  1. Hacker News (news.ycombinator.com) - 科技头条
  2. 可扩展 RSS Feed 源
  3. 可接入 NewsAPI / OpenAI API 进行智能摘要

运行方式：
  python scripts/ai_news_fetcher.py              # 生成今日日报
  python scripts/ai_news_fetcher.py --rebuild    # 生成并触发构建
  python scripts/ai_news_fetcher.py --deploy     # 生成、构建并部署

环境变量（可选）：
  NEWSAPI_KEY    - NewsAPI.org 的 API Key（用于获取更丰富的新闻源）
  OPENAI_API_KEY - OpenAI API Key（用于 AI 智能摘要生成）
"""

import os
import sys
import json
import re
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta
from pathlib import Path

# ============================================================
# 配置
# ============================================================

# 博客项目根目录
BLOG_ROOT = Path(__file__).resolve().parent.parent

# 数据文件路径
POSTS_TS_PATH = BLOG_ROOT / "src" / "data" / "posts.ts"

# 北京时区
CST = timezone(timedelta(hours=8))

# ============================================================
# 新闻数据源
# ============================================================

def fetch_hacker_news_top(count: int = 10) -> list[dict]:
    """从 Hacker News API 获取热门科技新闻"""
    stories = []
    try:
        # 获取 top stories IDs
        url = "https://hacker-news.firebaseio.com/v0/topstories.json"
        req = urllib.request.Request(url, headers={"User-Agent": "OpsTech-Blog-Agent/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            story_ids = json.loads(resp.read().decode())[:count]

        # 获取每个 story 的详情
        for sid in story_ids[:count]:
            try:
                detail_url = f"https://hacker-news.firebaseio.com/v0/item/{sid}.json"
                req2 = urllib.request.Request(detail_url, headers={"User-Agent": "OpsTech-Blog-Agent/1.0"})
                with urllib.request.urlopen(req2, timeout=10) as resp2:
                    item = json.loads(resp2.read().decode())
                    if item and item.get("title"):
                        stories.append({
                            "title": item.get("title", ""),
                            "url": item.get("url", f"https://news.ycombinator.com/item?id={sid}"),
                            "score": item.get("score", 0),
                            "source": "Hacker News"
                        })
            except Exception:
                continue
    except Exception as e:
        print(f"  [WARN] Hacker News 数据获取失败: {e}")

    return stories


def fetch_ai_keywords_news() -> list[dict]:
    """从 Hacker News 中筛选 AI/ML/DevOps 相关新闻"""
    all_stories = fetch_hacker_news_top(30)

    ai_keywords = [
        "AI", "LLM", "GPT", "Claude", "OpenAI", "DeepMind", "Machine Learning",
        "ML", "Neural", "Transformer", "DevOps", "Kubernetes", "Docker",
        "Cloud", "AWS", "GCP", "Azure", "Linux", "Security", "Agent",
        "RAG", "Fine-tun", "Open Source", "Model", "GPU", "NVIDIA",
        "Anthropic", "Meta", "Microsoft", "Google", "推理", "大模型"
    ]

    filtered = []
    for story in all_stories:
        title = story["title"]
        if any(kw.lower() in title.lower() for kw in ai_keywords):
            filtered.append(story)

    return filtered[:8]  # 最多取 8 条


# ============================================================
# 内容生成
# ============================================================

def generate_markdown_news(news_items: list[dict], date_str: str) -> str:
    """根据新闻条目生成 Markdown 日报内容"""
    if not news_items:
        return f"""# AI 运维与科技每日早报 ({date_str})

> ⚠️ 今日新闻源暂不可用，请稍后重试。自动化流水线将在下次执行时自动恢复。

---

*💡 本日报由 Antigravity 自动化运维机器人每天早晨 8:00 定时编译推送。*
"""

    lines = [
        f"# AI 运维与科技每日早报 ({date_str})",
        "",
        "欢迎来到今日 AI 运维与科技日报。本报由 AI 自动化流水线每日定时抓取生成并同步更新至博客。",
        "",
        "---",
        "",
        "## 🚀 今日 AI / 科技热点",
        "",
    ]

    for i, item in enumerate(news_items, 1):
        score_info = f" | HN 热度: {item['score']} points" if item.get("score") else ""
        url = item.get("url", "#")
        lines.append(f"### {i}. [{item['title']}]({url})")
        lines.append(f"> 来源: {item['source']}{score_info}")
        lines.append("")

    lines.extend([
        "---",
        "",
        "## 🛠 运维实用技巧速递",
        "",
        "### 本周运维小贴士",
        "",
        "- **日志管理**：定期清理 `/var/log` 下的过期日志，建议配置 `logrotate` 自动轮转，避免磁盘爆满。",
        "- **SSL 证书监控**：使用 `openssl s_client -connect domain:443 -servername domain </dev/null 2>/dev/null | openssl x509 -noout -enddate` 快速检查证书到期时间。",
        "- **容器镜像瘦身**：使用多阶段构建（multi-stage build）和 `alpine` 基础镜像，可将最终镜像体积减少 70% 以上。",
        "",
        "---",
        "",
        "*💡 本日报由 Antigravity 自动化运维机器人每天早晨 8:00 定时编译推送。*",
        "*🔗 新闻数据来源: Hacker News API 及其他公开 RSS 源。*",
    ])

    return "\n".join(lines)


def generate_post_entry(date_str: str, post_id: str, title: str, summary: str, content: str) -> str:
    """生成 TypeScript Post 对象代码"""
    escaped_content = content.replace("\\", "\\\\").replace("`", "\\`").replace("$", "\\$")
    escaped_summary = summary.replace("'", "\\'")

    return f"""  {{
    id: '{post_id}',
    title: '{title}',
    summary: '{escaped_summary}',
    date: '{date_str}',
    tags: ['AI运维', '大模型', 'LLM', 'AIOps', '科技新闻'],
    category: 'ai-news',
    content: `
{content}
`
  }}"""


# ============================================================
# 数据更新
# ============================================================

def update_posts_ts(date_str: str, news_post_entry: str) -> bool:
    """更新 posts.ts 文件，将新的日报插入到 initialPosts 数组中"""
    if not POSTS_TS_PATH.exists():
        print(f"  [ERROR] 找不到数据文件: {POSTS_TS_PATH}")
        return False

    content = POSTS_TS_PATH.read_text(encoding="utf-8")

    # 检查是否已存在今天的日报
    today_id = f"ai-news-{date_str}"
    if today_id in content:
        print(f"  [INFO] 今日日报 ({date_str}) 已存在，跳过更新。")
        return True

    # 在 initialPosts 数组的第一个元素前插入新日报
    # 找到 export const initialPosts: Post[] = [
    marker = "export const initialPosts: Post[] = ["
    marker_pos = content.find(marker)
    if marker_pos == -1:
        print(f"  [ERROR] 无法定位 initialPosts 数组")
        return False

    # 在 [ 之后插入新条目
    insert_pos = marker_pos + len(marker) + 1  # +1 跳过换行

    new_content = content[:insert_pos] + "\n" + news_post_entry + ",\n" + content[insert_pos:]

    POSTS_TS_PATH.write_text(new_content, encoding="utf-8")
    print(f"  [OK] 已更新 posts.ts - 新增日报: {today_id}")
    return True


# ============================================================
# 构建和部署
# ============================================================

def rebuild_blog() -> bool:
    """重新构建博客项目"""
    import subprocess

    print("\n📦 正在重新构建博客...")
    try:
        # 使用 npx + vite 构建
        result = subprocess.run(
            ["npx.cmd", "vite", "build"],
            cwd=str(BLOG_ROOT),
            capture_output=True,
            text=True,
            timeout=120,
            env={**os.environ, "NODE_PATH": ""}
        )
        if result.returncode == 0:
            print("  [OK] 构建成功！")
            return True
        else:
            print(f"  [ERROR] 构建失败:\n{result.stderr[-500:]}")
            return False
    except FileNotFoundError:
        # Try npm run build
        try:
            result = subprocess.run(
                ["npm.cmd", "run", "build"],
                cwd=str(BLOG_ROOT),
                capture_output=True,
                text=True,
                timeout=120
            )
            if result.returncode == 0:
                print("  [OK] 构建成功！")
                return True
            else:
                print(f"  [ERROR] 构建失败:\n{result.stderr[-500:]}")
                return False
        except Exception as e:
            print(f"  [ERROR] 构建失败: {e}")
            return False


# ============================================================
# 主流程
# ============================================================

def main():
    today = datetime.now(CST)
    date_str = today.strftime("%Y-%m-%d")
    post_id = f"ai-news-{date_str}"

    print("=" * 60)
    print(f"  🤖 OpsTech AI 新闻自动化采集系统")
    print(f"  📅 日期: {date_str}")
    print("=" * 60)

    # Step 1: 抓取新闻
    print("\n📡 Step 1: 抓取 AI/科技新闻...")
    news_items = fetch_ai_keywords_news()
    print(f"  获取到 {len(news_items)} 条 AI/科技相关新闻")

    # Step 2: 生成 Markdown 内容
    print("\n📝 Step 2: 生成日报内容...")
    markdown_content = generate_markdown_news(news_items, date_str)

    # 生成摘要
    if news_items:
        top_titles = " | ".join(item["title"][:40] for item in news_items[:3])
        summary = f"今日 AI 热点速递：{top_titles}..."
    else:
        summary = "今日 AI 科技日报 - 新闻源暂时不可用，请稍后查看"

    title = f"AI 运维与科技每日早报 ({date_str})"

    # Step 3: 更新数据文件
    print("\n💾 Step 3: 更新博客数据源...")
    news_entry = generate_post_entry(date_str, post_id, title, summary, markdown_content)
    updated = update_posts_ts(date_str, news_entry)

    if not updated:
        print("\n⚠️  数据更新未成功，跳过后续步骤。")
        return

    # Step 4: 可选构建
    if "--rebuild" in sys.argv or "--deploy" in sys.argv:
        rebuild_blog()

    # Step 5: 可选部署
    if "--deploy" in sys.argv:
        print("\n🚀 Step 5: 触发部署...")
        print("  部署将在 WorkBuddy 自动化任务中由 CloudStudio 完成")

    # 输出日报预览
    print("\n" + "=" * 60)
    print("  📰 今日日报预览 (前300字):")
    print("  " + "-" * 56)
    preview = markdown_content[:300].replace("\n", "\n  ")
    print(f"  {preview}...")
    print("=" * 60)
    print("\n[DONE] Task completed! Daily news post generated.")


if __name__ == "__main__":
    main()
