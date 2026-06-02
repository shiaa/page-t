#!/usr/bin/env python3
"""
从 automation-2026-05-17-task-1 目录批量提取 AI 日报 HTML，
转换为博客 Markdown 格式并生成 TypeScript Post 条目。
"""

import re
import os
from pathlib import Path
from datetime import datetime

NEWS_DIR = Path(r"C:\Users\AI\WorkBuddy\automation-2026-05-17-task-1")
OUTPUT_FILE = Path(r"C:\code\page-yw\blog\src\data\generated_news.ts")

def extract_date_from_filename(filename: str) -> str:
    """从文件名提取日期，如 ai-news-2026-06-01.html → 2026-06-01"""
    match = re.search(r"(\d{4}-\d{2}-\d{2})", filename)
    return match.group(1) if match else ""


def html_to_text(html: str) -> str:
    """移除 HTML 标签，保留纯文本"""
    text = re.sub(r"<style[^>]*>.*?</style>", "", html, flags=re.DOTALL)
    text = re.sub(r"<br\s*/?>", "\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = text.replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
    return text


def extract_markdown_from_html(filepath: Path) -> tuple[str, str, str]:
    """
    从 HTML 文件中提取内容并转换为 Markdown。
    返回: (date_str, title, markdown_content)
    """
    html = filepath.read_text(encoding="utf-8")
    date_str = extract_date_from_filename(filepath.name)
    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
    weekdays = ["一", "二", "三", "四", "五", "六", "日"]
    weekday = weekdays[date_obj.weekday()]

    md_lines = []
    md_lines.append(f"# AI 每日动态 · {date_obj.year}年{date_obj.month}月{date_obj.day}日 · 星期{weekday}")
    md_lines.append("")
    md_lines.append("关注 AI Coding · 具身智能 · 前沿技术 | 由 WorkBuddy AI 自动生成")
    md_lines.append("")
    md_lines.append("---")
    md_lines.append("")

    # --- 提取各板块 ---
    def extract_cards(html_fragment: str, card_start_index: int = 1) -> list[str]:
        """从 HTML 片段中提取所有 card，返回 markdown 行列表"""
        lines: list[str] = []
        cards = re.split(r'<div class="card(?:[" ])[^>]*>', html_fragment)
        for ci, card in enumerate(cards[1:], card_start_index):
            # 提取标签
            tag_match = re.search(r'<div class="card-tag[^"]*">(.*?)</div>', card)
            tag = html_to_text(tag_match.group(1)).strip() if tag_match else ""
            
            # 提取标题 (可能是 h3 或 card-title div)
            title_match = re.search(r'<h3>(.*?)</h3>', card)
            if not title_match:
                title_match = re.search(r'<div class="card-title">(.*?)</div>', card)
            title = html_to_text(title_match.group(1)).strip() if title_match else ""

            # 提取正文
            body_match = re.search(r'<div class="card-body">(.*?)</div>', card, re.DOTALL)
            body = ""
            if body_match:
                body_html = body_match.group(1)
                body = html_to_text(body_html).strip()
                body = re.sub(r"\n{3,}", "\n\n", body)
                body = re.sub(r" {2,}", " ", body)

            # 提取 why-matters
            why_match = re.search(r'<div class="(?:why-matters|card-why|why-box)[^"]*">(.*?)</div>', card, re.DOTALL)
            why = ""
            if why_match:
                why_html = why_match.group(1)
                why = html_to_text(why_html).strip()
                why = re.sub(r"\n{3,}", "\n\n", why)

            lines.append(f"### {ci}. {title}")
            lines.append("")
            if tag:
                lines.append(f"> 标签: {tag}")
                lines.append("")
            if body:
                lines.append(body)
                lines.append("")
            if why:
                lines.append(f"💡 **值得关注**: {why}")
                lines.append("")
            lines.append("")
        return lines

    # 尝试按 section 分组（新格式：<h2>，旧格式：<div class="section-title">）
    sections = re.split(r'<div class="section(?:"|\s)[^>]*>', html)
    
    if len(sections) > 1:
        # 有 section 分组
        for section in sections[1:]:
            section_title_match = re.search(r'<h2>(.*?)</h2>', section)
            if not section_title_match:
                section_title_match = re.search(r'<div class="section-title">(.*?)</div>', section)
            if not section_title_match:
                continue
            section_title = html_to_text(section_title_match.group(1)).strip()
            md_lines.append(f"## {section_title}")
            md_lines.append("")
            md_lines.extend(extract_cards(section))
            md_lines.append("---")
            md_lines.append("")
    else:
        # 无 section 分组，所有卡片扁平排列（最旧格式）
        card_search = re.search(r'<div class="card(?:[" ])[^>]*>', html)
        if card_search:
            md_lines.append("## 综合动态")
            md_lines.append("")
            md_lines.extend(extract_cards(html[card_search.start():]))
            md_lines.append("---")
            md_lines.append("")

    # Footer
    md_lines.append("*由 WorkBuddy AI 自动生成 · 数据来源：AITNT · 新浪财经 · IT之家 · 量子位 · 财新网 · 雪球*")

    markdown = "\n".join(md_lines)
    
    # 生成 title (简短版)
    title = f"AI 每日动态 ({date_str})"
    
    return date_str, title, markdown


def generate_post_ts(date_str: str, post_id: str, title: str, content: str) -> str:
    """生成 TypeScript Post 条目代码"""
    # 生成摘要：跳过头部（标题、副标题、分隔线），从正文第一个 ## 板块开始取
    body_start = content.find("## ")
    if body_start > 0:
        # 跳过 ## 板块标题行，从下一行（即第一条新闻）开始
        body = content[body_start:]
        first_newline = body.find("\n")
        if first_newline > 0:
            body = body[first_newline:].strip()
    else:
        body = content
    # 去掉 markdown 标记，取前 120 字作为摘要
    plain = re.sub(r"[#*>`\-\|\n]", " ", body)
    plain = re.sub(r"\s+", " ", plain).strip()
    summary = plain[:120] + "..." if len(plain) > 120 else plain
    summary = summary.replace("'", "\\'")

    # 转义 content 中的特殊字符
    safe_content = content.replace("\\", "\\\\").replace("`", "\\`").replace("$", "\\$")

    return f"""  {{
    id: '{post_id}',
    title: '{title}',
    summary: '{summary}',
    date: '{date_str}',
    tags: ['AI日报', 'AI编程', '具身智能', '行业动态', '科技新闻'],
    category: 'ai-news',
    content: `
{safe_content}
`
  }}"""


def main():
    print("=" * 60)
    print("  提取 AI 日报 HTML → Markdown → TypeScript Post")
    print("=" * 60)

    html_files = sorted(NEWS_DIR.glob("ai-news-*.html"), reverse=True)
    if not html_files:
        print(f"  [ERROR] 未找到日报文件: {NEWS_DIR}")
        return

    print(f"\n  找到 {len(html_files)} 个日报文件:")
    for f in html_files:
        print(f"    - {f.name}")

    # 提取所有日报
    all_entries = []
    for filepath in html_files:
        try:
            date_str, title, markdown = extract_markdown_from_html(filepath)
            post_id = f"ai-news-daily-{date_str}"
            ts_entry = generate_post_ts(date_str, post_id, title, markdown)
            all_entries.append((date_str, ts_entry))
            print(f"  [OK] {filepath.name} → {post_id}")
        except Exception as e:
            print(f"  [ERROR] {filepath.name}: {e}")

    # 生成 TypeScript 文件
    output = "// 自动生成的 AI 日报条目\n// 由 scripts/extract_news.py 从 automation-2026-05-17-task-1 提取\n\nexport const aiNewsPosts = [\n"
    for _, entry in all_entries:
        output += entry + ",\n"
    output += "] as const;\n"

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(output, encoding="utf-8")
    
    print(f"\n[DONE] Generated {len(all_entries)} daily news posts -> {OUTPUT_FILE}")
    print(f"   File size: {OUTPUT_FILE.stat().st_size} bytes")


if __name__ == "__main__":
    main()
