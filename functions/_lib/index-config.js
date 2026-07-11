export const INDEX_METHOD_WEIGHTS = { elo: 0.6, complete_ranking: 0.4 };

export const INDEX_TRACKS = [
  {
    id: "mario",
    name: "一句话马里奥",
    planned_weight: 0.5,
    dirs: {
      "gpt-5.6-luna": "5.6luna", "gpt-5.6-sol": "5.6sol", "gpt-5.6-terra": "5.6terra",
      "gpt-5.5": "gpt5.5", "gpt-5.4-mini": "gpt-5.4-mini", "claude-fable-5": "fable5",
      "claude-sonnet": "claude-sonnet", "claude-haiku": "claude-haiku", "claude-opus": "claude-opus",
      "composer-2.5": "composer2.5", "glm-5.2": "glm5.2", "grok-4.5": "grok4.5",
      "kimi-k2.7-code": "k2.7code", "gemini-3.1-pro": "gemini-3.1-pro", "deepseek-v4-pro": "deepseek-v4-pro",
    },
  },
  {
    id: "solar-system",
    name: "一句话太阳系",
    planned_weight: 0.5,
    dirs: {
      "gpt-5.6-luna": "gpt5.6luna", "gpt-5.6-sol": "gpt5.6sol", "gpt-5.6-terra": "gpt5.6terra",
      "gpt-5.5": "gpt5.5", "gpt-5.4-mini": "gpt5.4mini", "claude-fable-5": "claude-fable-5",
      "claude-sonnet": "claude-sonnet", "claude-haiku": "claude-haiku", "claude-opus": "claude-opus",
      "composer-2.5": "composer2.5", "glm-5.2": "glm5.2", "grok-4.5": "grok4.5",
      "kimi-k2.7-code": "kimi-k2.7code", "gemini-3.1-pro": "gemini3.1pro", "deepseek-v4-pro": "deepseek-v4-pro",
    },
  },
];

export const INDEX_ROSTER = Object.keys(INDEX_TRACKS[0].dirs).map((key) => ({
  key,
  primary_dir: INDEX_TRACKS[0].dirs[key],
}));
