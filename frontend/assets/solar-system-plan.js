/* Generated from tracks/solar-system/_run_plan.json. Do not edit directly. */
window.SOLAR_SYSTEM_RUN_PLAN = {
  "track": "solar-system",
  "plan_version": "1.1",
  "status": "completed_verified",
  "prompt_template": "帮我做一个可以交互探索的太阳系九大行星立体运行网页，包含冥王星。\n\n请将最终可运行的完整网页作品放在以下目录中：\n\n【目标目录】\n\n要求：\n1. 你可以自行规划、编写、运行和调试作品。\n2. 只能访问和操作上述目标目录。\n3. 不要读取、搜索、列出或参考父目录、其他模型的文件夹或其他参赛作品。\n4. 所有新增或修改的文件必须放在上述目标目录内。\n5. 最终网页入口必须是目标目录中的 index.html。\n6. 请完成实际可以交互探索的网页成品，不要只提供代码说明、设计方案或伪代码。\n7. 可以自行选择 HTML、CSS、JavaScript、Canvas、WebGL 或网页 3D 技术。\n8. 完成后请自行运行和调试，并确认 index.html 可以在浏览器中正常打开。\n9. 不要向我询问设计细节，请自主完成整个作品。\n10. 完成后只需报告生成的文件、运行方式和验证结果。\n\n现在开始执行，不要只回复计划。",
  "prompt_substitution_rule": "每次只将【目标目录】替换为该运行位的 target_dir;其他文字逐字不变",
  "runs": [
    {
      "slug": "claude-fable-5",
      "model": "Claude Fable 5",
      "vendor": "Anthropic",
      "harness": "Claude Code",
      "machine": "vircs",
      "target_dir": "/root/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/claude-fable/",
      "status": "completed_verified",
      "execution_mode": "interactive_tui_tmux",
      "transcript_path": "/root/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/logs/batch-20260714/arcade_ss_fable.log"
    },
    {
      "slug": "claude-sonnet",
      "model": "Claude Sonnet",
      "vendor": "Anthropic",
      "harness": "Claude Code",
      "machine": "vircs",
      "target_dir": "/root/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/claude-sonnet/",
      "status": "completed_verified",
      "execution_mode": "interactive_tui_tmux",
      "transcript_path": "/root/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/logs/batch-20260714/arcade_ss_sonnet.log"
    },
    {
      "slug": "claude-opus",
      "model": "Claude Opus",
      "vendor": "Anthropic",
      "harness": "Claude Code",
      "machine": "vircs",
      "target_dir": "/root/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/claude-opus/",
      "status": "completed_verified",
      "execution_mode": "interactive_tui_tmux",
      "transcript_path": "/root/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/logs/batch-20260714/arcade_ss_opus.log"
    },
    {
      "slug": "gpt5.6luna",
      "model": "GPT-5.6 Luna",
      "vendor": "OpenAI",
      "harness": "Codex",
      "machine": "vircs",
      "target_dir": "/root/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/gpt-5.6-luna/",
      "status": "completed_verified",
      "execution_mode": "interactive_tui_tmux",
      "transcript_path": "/root/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/logs/batch-20260714/arcade_ss_gpt56luna.log",
      "human_code_edits": 1,
      "maintenance_note": "上线前最小修复：将脚本误写的 #planetKicker 更正为页面现有的 #panelKicker"
    },
    {
      "slug": "gpt5.6sol",
      "model": "GPT-5.6 Sol",
      "vendor": "OpenAI",
      "harness": "Codex",
      "machine": "vircs",
      "target_dir": "/root/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/gpt-5.6-sol/",
      "status": "completed_verified",
      "execution_mode": "interactive_tui_tmux",
      "transcript_path": "/root/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/logs/batch-20260714/arcade_ss_gpt56sol.log"
    },
    {
      "slug": "gpt5.6terra",
      "model": "GPT-5.6 Terra",
      "vendor": "OpenAI",
      "harness": "Codex",
      "machine": "vircs",
      "target_dir": "/root/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/gpt-5.6-terra/",
      "status": "completed_verified",
      "execution_mode": "interactive_tui_tmux",
      "transcript_path": "/root/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/logs/batch-20260714/arcade_ss_gpt56terra.log"
    },
    {
      "slug": "gpt5.5",
      "model": "GPT-5.5",
      "vendor": "OpenAI",
      "harness": "Codex",
      "machine": "vircs",
      "target_dir": "/root/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/gpt-5.5/",
      "status": "completed_verified",
      "execution_mode": "interactive_tui_tmux",
      "transcript_path": "/root/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/logs/batch-20260714/arcade_ss_gpt55.log"
    },
    {
      "slug": "gpt5.4",
      "model": "GPT-5.4",
      "vendor": "OpenAI",
      "harness": "Codex",
      "machine": "vircs",
      "target_dir": "/root/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/gpt-5.4/",
      "status": "completed_verified",
      "execution_mode": "interactive_tui_tmux",
      "transcript_path": "/root/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/logs/batch-20260714/arcade_ss_gpt54.log"
    },
    {
      "slug": "gpt5.4mini",
      "model": "GPT-5.4 Mini",
      "vendor": "OpenAI",
      "harness": "Codex",
      "machine": "vircs",
      "target_dir": "/root/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/gpt-5.4-mini/",
      "status": "completed_verified",
      "execution_mode": "interactive_tui_tmux",
      "transcript_path": "/root/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/logs/batch-20260714/arcade_ss_gpt54mini.log"
    },
    {
      "slug": "composer2.5",
      "model": "Composer 2.5",
      "vendor": "Cursor",
      "harness": "Cursor",
      "machine": "Mac",
      "target_dir": "/Users/liuyibo/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/composer2.5/",
      "status": "completed_verified"
    },
    {
      "slug": "glm5.2",
      "model": "GLM-5.2",
      "vendor": "智谱 AI",
      "harness": "Cursor",
      "machine": "Mac",
      "target_dir": "/Users/liuyibo/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/glm5.2/",
      "status": "completed_verified"
    },
    {
      "slug": "grok4.5",
      "model": "Grok 4.5",
      "vendor": "xAI",
      "harness": "Cursor",
      "machine": "Mac",
      "target_dir": "/Users/liuyibo/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/grok4.5/",
      "status": "completed_verified"
    },
    {
      "slug": "kimi-k2.7code",
      "model": "Kimi K2.7-Code",
      "vendor": "Moonshot AI",
      "harness": "Cursor",
      "machine": "Mac",
      "target_dir": "/Users/liuyibo/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/kimi-k2.7code/",
      "status": "completed_verified"
    },
    {
      "slug": "gemini3.1pro",
      "model": "Gemini 3.1 Pro",
      "vendor": "Google",
      "harness": "Cursor",
      "machine": "Mac",
      "target_dir": "/Users/liuyibo/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/gemini3.1pro/",
      "status": "completed_verified"
    },
    {
      "slug": "deepseek-v4-pro",
      "model": "DeepSeek V4 Pro",
      "vendor": "DeepSeek",
      "harness": "Claude Code + Claude Code Router",
      "machine": "Mac",
      "target_dir": "/Users/liuyibo/Desktop/lyb/llm-arcade-runs/solar-system-9-planets/deepseek-v4-pro/",
      "status": "completed_verified"
    }
  ]
};
