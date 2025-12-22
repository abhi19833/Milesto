import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Clock,
  Target,
} from "lucide-react";
import Cookies from "js-cookie";

const getGeminiInsightsAPI = async (tasks, projects) => {
  const token = Cookies.get("token");

  if (!token) {
    throw new Error("Authentication token not found. Please log in.");
  }

  const response = await fetch(`/api/dashboard/ai-insights?_t=${Date.now()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch AI insight");
  }

  const data = await response.json();
  console.log("AI Insights data from backend:", data);
  return data.insights || [];
};

const iconMap = {
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Clock,
  Target,
  Brain,
};

const AIInsights = ({ tasks = [], projects = [] }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const aiInsights = await getGeminiInsightsAPI(tasks, projects);

        const formattedInsights = aiInsights.map((insight) => {
          const type = insight.type;
          const priority = insight.priority;
          const iconName =
            type === "success"
              ? "TrendingUp"
              : type === "warning"
              ? "AlertTriangle"
              : "Target";
          return {
            title: insight.title,
            message: insight.description,
            type,
            priority,
            iconName,
            icon: iconMap[iconName] || Brain,
            color:
              type === "warning"
                ? "text-orange-500"
                : type === "success"
                ? "text-green-500"
                : "text-blue-500",
          };
        });

        setInsights(formattedInsights);
      } catch (error) {
        console.error("Error fetching AI insight", error);
        setInsights([
          {
            type: "warning",
            title: "Insights Unavailable",
            message: `Failed load AI insight: ${error.message}. Pleasee check your network and server.`,
            icon: AlertTriangle,
            color: "text-red-500",
            priority: "high",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (tasks.length > 0 || projects.length > 0) {
      fetchInsights();
    } else {
      setInsights([
        {
          type: "info",
          title: "Getting Started",
          message:
            "Add tasks and projects to receive  insights from Gemini AI.",
          icon: Brain,
          color: "text-purple-500",
          priority: "low",
        },
      ]);
      setLoading(false);
    }
  }, [tasks, projects]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center justify-center h-full">
        <div className="flex items-center space-x-2 text-gray-500">
          <Brain className="h-5 w-5 animate-pulse" />
          <span>Analyzing data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <insight.icon className={`h-5 w-5 ${insight.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {insight.title}
                  </h4>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      insight.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : insight.priority === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {insight.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{insight.message}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AIInsights;
