import Groq from "groq-sdk";
import "dotenv/config";

const groq = new Groq({
  apiKey: process.env.GEMINI_API_KEY,
});

export const generateDashboardInsights = async (projects, tasks, documents) => {
  try {
    // Project Summary
    const projectSummary = projects.map((p) => ({
      id: p._id,
      title: p.title,
      status: p.status,
      progress: p.progress,
      teamMembers: p.teamMembers?.length || 0,
      createdAt: p.createdAt,
    }));

    // Task Summary
    const taskSummary = tasks.map((t) => ({
      id: t._id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      projectId: t.projectId,
      createdAt: t.createdAt,
    }));

    // Document Summary
    const documentSummary = documents.map((d) => ({
      id: d._id,
      title: d.title,
      type: d.type,
      projectId: d.projectId,
      aiAnalysisScore: d.aiAnalysis?.score || 0,
      createdAt: d.createdAt,
    }));

    // Prompt
    const prompt = `
You are an AI productivity assistant.

Analyze the provided projects, tasks, and documents.

Generate meaningful dashboard insights.

IMPORTANT:
- Return ONLY valid JSON
- Do NOT use markdown
- Do NOT use triple backticks
- Return ONLY JSON array

Required Format:

[
  {
    "title": "Project Completion Rate",
    "description": "Most projects are progressing steadily.",
    "value": 75,
    "trend": "up",
    "type": "success",
    "priority": "medium"
  }
]

Rules:
- trend must be: up | down | stable
- type must be: success | warning | info
- priority must be: high | medium | low
- value must be number
- Generate 4 to 6 insights

Projects:
${JSON.stringify(projectSummary)}

Tasks:
${JSON.stringify(taskSummary)}

Documents:
${JSON.stringify(documentSummary)}
`;

    // AI Response
    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const text = completion.choices[0]?.message?.content || "";

    let insights = [];

    try {
      insights = JSON.parse(text);

      if (!Array.isArray(insights)) {
        insights = [insights];
      }
    } catch (parseError) {
      console.error("Groq JSON Parse Error:", parseError);
      console.error("Raw AI Output:", text);

      return [
        {
          title: "AI Insights Temporarily Unavailable",
          description:
            "Unexpected AI response received. Please try again shortly.",
          value: 0,
          trend: "down",
          type: "warning",
          priority: "high",
        },
      ];
    }

    return insights;
  } catch (error) {
    console.error("Groq AI Error:", error);

    const isRateLimit =
      error?.status === 429 ||
      error?.message?.includes("Too Many Requests") ||
      error?.message?.includes("rate limit");

    return [
      {
        title: "AI Insights Temporarily Unavailable",
        description: isRateLimit
          ? "AI insights are temporarily unavailable due to high usage. Please try again shortly."
          : "Unable to generate AI insights right now. Please try again later.",
        value: 0,
        trend: "down",
        type: "warning",
        priority: "high",
      },
    ];
  }
};
