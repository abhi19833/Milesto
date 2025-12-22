import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateDashboardInsights = async (projects, tasks, documents) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const projectSummary = projects.map((p) => ({
      id: p._id,
      title: p.title,
      status: p.status,
      progress: p.progress,
      teamMembers: p.teamMembers.length,
      createdAt: p.createdAt,
    }));

    const taskSummary = tasks.map((t) => ({
      id: t._id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      projectId: t.projectId,
      createdAt: t.createdAt,
    }));

    const documentSummary = documents.map((d) => ({
      id: d._id,
      title: d.title,
      type: d.type,
      projectId: d.projectId,
      aiAnalysisScore: d.aiAnalysis?.score || 0,
      createdAt: d.createdAt,
    }));

    const prompt = `
Generate dashboard insights based on the following data.
Return ONLY valid JSON.
Do NOT use markdown.
Do NOT use \`\`\`.
Return a JSON array of objects.

Each object must contain:
- title
- description
- value
- trend (up | down | stable)
- type (success | warning | info)
- priority (high | medium | low)

Projects:
${JSON.stringify(projectSummary, null, 2)}

Tasks:
${JSON.stringify(taskSummary, null, 2)}

Documents:
${JSON.stringify(documentSummary, null, 2)}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    let insights;

    try {
      const cleanedText = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      insights = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Gemini JSON parse failed:", parseError);
      console.error("Raw Gemini output:", text);

      return [
        {
          title: "AI Insights Temporarily Unavailable",
          description:
            "We received  unexpected response from the AI service. Please try again shortly.",
          value: 0,
          trend: "down",
          type: "warning",
          priority: "high",
        },
      ];
    }

    if (!Array.isArray(insights)) {
      insights = [insights];
    }

    return insights;
  } catch (error) {
    console.error("Gemini AI error:", error);

    const isRateLimit =
      error?.status === 429 ||
      error?.message?.includes("Too Many Requests") ||
      error?.message?.includes("quota");

    return [
      {
        title: "AI Insights Temporarily Unavailable",
        description: isRateLimit
          ? "AI insights are temporarily unavailable duee high usage. Please try again in a few moments."
          : "We couldn’t generate AI insights  now. Please try again later.",
        value: 0,
        trend: "down",
        type: "warning",
        priority: "high",
      },
    ];
  }
};
