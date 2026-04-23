export const mcpVerticalSample = {
  hook: {
    eyebrow: "Episode 01",
    headline: "MCP gives AI real ways to act, not just talk.",
    supportingText:
      "Use this sample composition as the first bridge between your script workflow and Remotion scenes.",
    accentWords: ["MCP", "AI"],
  },
  definition: {
    term: "MCP",
    definition:
      "A standard layer that lets models connect to tools, resources, and structured actions in a reusable way.",
    bullets: [
      "Good fit for tool calling and workflow orchestration",
      "Useful when one model needs access to multiple external systems",
      "Should later be fed by generated content_script and visual_script data",
    ],
  },
  close: {
    headline: "From workflow draft to reusable video system.",
    subheadline:
      "Next step: replace this sample data with your MCP topic script and scene payloads.",
  },
} as const;
