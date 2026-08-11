#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI 日报自动化流水线（容错 / 幂等版）

步骤：
  1) 提取日报   extract_news.py  (HTML -> Markdown -> TypeScript Post)
  2) 构建       vite build
  3) 提交推送   git add/commit/push（仅在有变更时提交，避免空提交报错）
  4) 触发部署   EdgeOne Pages webhook

设计目标 —— 保证整条流水线「正常执行完成」：
  - 每步独立容错，单步失败不中断后续步骤，末尾统一汇总；
  - 无变更时自动跳过提交/部署（空提交会让 git 退出非零，从而误判失败）；
  - 全程不抛出未捕获异常，任何情况下都打印汇总并以明确退出码结束。

退出码：
  0  核心步骤（提取+构建）成功，流水线完成（含幂等跳过场景）
  2  核心步骤失败（提取或构建异常），内容未就绪
"""

import json
import subprocess
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

# ---------------- 路径配置 ----------------
BLOG_DIR = Path(r"C:\code\page-yw\blog")
PYTHON = r"C:\Users\AI\.workbuddy\binaries\python\versions\3.13.12\python.exe"
NODE = r"C:\Users\AI\.workbuddy\binaries\node\versions\22.22.2\node.exe"
VITE = BLOG_DIR / "node_modules" / "vite" / "bin" / "vite.js"
EXTRACT = BLOG_DIR / "scripts" / "extract_news.py"
WEBHOOK_URL = (
    "https://pages-api.cloud.tencent.com/v1/webhook/"
    "8c1574a344d1143ca1104c3c7548b44c66c4b1cb6d44f1cdd2203fcbfb60b224"
)

status: dict[str, tuple[bool, str]] = {}


def run_cmd(cmd, cwd=None):
    """执行命令，返回 (returncode, CompletedProcess)。"""
    return subprocess.run(cmd, cwd=str(cwd) if cwd else None), None


def step_report(name, ok, info):
    status[name] = (ok, info)
    mark = "OK " if ok else "ERR"
    print(f"  [{mark}] {name}: {info}")


# ---------------- 各步骤实现 ----------------
def do_extract():
    print("\n--- 步骤 1/4：提取日报 ---")
    try:
        r = subprocess.run([PYTHON, str(EXTRACT)])
        ok = r.returncode == 0
        step_report("提取日报", ok, "退出码 0" if ok else f"退出码 {r.returncode}")
        return ok
    except Exception as e:
        step_report("提取日报", False, f"异常: {e}")
        return False


def do_build():
    print("\n--- 步骤 2/4：Vite 构建 ---")
    try:
        r = subprocess.run([NODE, str(VITE), "build"], cwd=str(BLOG_DIR))
        ok = r.returncode == 0
        step_report("构建", ok, "构建成功" if ok else f"退出码 {r.returncode}")
        return ok
    except Exception as e:
        step_report("构建", False, f"异常: {e}")
        return False


def do_git():
    print("\n--- 步骤 3/4：提交并推送 ---")
    try:
        subprocess.run(["git", "-C", str(BLOG_DIR), "add", "-A"], check=True)
        out = subprocess.run(
            ["git", "-C", str(BLOG_DIR), "status", "--porcelain"],
            capture_output=True, text=True,
        )
        if not out.stdout.strip():
            step_report("提交推送", True, "无变更，跳过")
            return False  # 返回 False 仅用于通知调用方「无需部署」
        today = datetime.now().strftime("%Y-%m-%d")
        c = subprocess.run(
            ["git", "-C", str(BLOG_DIR), "commit",
             "-m", f"chore: AI日报更新 {today}"]
        )
        if c.returncode != 0:
            step_report("提交推送", False, f"commit 失败 退出码 {c.returncode}")
            return False
        p = subprocess.run(["git", "-C", str(BLOG_DIR), "push", "origin", "master"])
        if p.returncode != 0:
            step_report("提交推送", False, f"push 失败 退出码 {p.returncode}")
            return False
        step_report("提交推送", True, "已提交并推送到 master")
        return True
    except Exception as e:
        step_report("提交推送", False, f"异常: {e}")
        return False


def do_webhook():
    print("\n--- 步骤 4/4：触发 EdgeOne 部署 ---")
    try:
        req = urllib.request.Request(WEBHOOK_URL, method="POST", data=b"")
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8", "ignore")
            http_code = resp.getcode()
        deployment = ""
        try:
            j = json.loads(body)
            deployment = j.get("data", {}).get("res", {}).get("deploymentId", "")
        except Exception:
            pass
        if http_code == 200 and ("\"code\":0" in body or '"code": 0' in body):
            step_report("触发部署", True, f"触发成功 deployment={deployment}")
        else:
            step_report("触发部署", False, f"HTTP {http_code} {body[:160]}")
    except Exception as e:
        step_report("触发部署", False, f"请求异常: {e}")


# ---------------- 主流程 ----------------
def main():
    print("=" * 60)
    print(f"  AI 日报自动化流水线  {datetime.now():%Y-%m-%d %H:%M:%S}")
    print("=" * 60)

    extract_ok = do_extract()
    if extract_ok:
        build_ok = do_build()
    else:
        build_ok = False
        step_report("构建", False, "跳过（提取失败）")

    if extract_ok:
        pushed = do_git()  # True=已推送变更；False=跳过或无变更
    else:
        pushed = False
        step_report("提交推送", False, "跳过（提取失败）")

    # 构建成功即触发部署：部署的是构建产物，确保线上与最新构建一致。
    # （EdgeOne 从源码重建，无 git 变更时为无害重部署）
    if build_ok:
        do_webhook()
    else:
        step_report("触发部署", False, "跳过（构建失败）")

    # ---------------- 汇总 ----------------
    print("\n" + "=" * 60)
    print("  执行汇总")
    print("=" * 60)
    for name, (ok, info) in status.items():
        mark = "OK " if ok else "ERR"
        print(f"  [{mark}] {name}: {info}")

    core_ok = extract_ok and build_ok
    print("\n结果:", "完成" if core_ok else "失败（核心步骤异常）")
    sys.exit(0 if core_ok else 2)


if __name__ == "__main__":
    main()
