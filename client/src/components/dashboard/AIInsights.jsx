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
import api from "../../api/axiosInstance";

const getGeminiInsightsAPI = async () => {
  const response = await api.get("/dashboard/ai-insights");
  return response.data.insights || [];
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

  const isDataReady = Array.isArray(tasks) && Array.isArray(projects);

  useEffect(() => {
    if (!isDataReady) return;

    const fetchInsights = async () => {
      setLoading(true);
      try {
        const aiInsights = await getGeminiInsightsAPI();

        const formattedInsights = aiInsights.map((insight) => {
          const iconName =
            insight.type === "success"
              ? "TrendingUp"
              : insight.type === "warning"
              ? "AlertTriangle"
              : "Target";

          return {
            title: insight.title,
            message: insight.description,
            type: insight.type,
            priority: insight.priority,
            icon: iconMap[iconName] || Brain,
            color:
              insight.type === "warning"
                ? "text-orange-500"
                : insight.type === "success"
                ? "text-green-500"
                : "text-blue-500",
          };
        });

        setInsights(formattedInsights);
      } catch (error) {
        setInsights([
          {
            title: "Insights Unavailable",
            message: "Failed to load AI insights.",
            icon: AlertTriangle,
            color: "text-red-500",
            priority: "high",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (tasks.length === 0 && projects.length === 0) {
      setInsights([
        {
          title: "Getting Started",
          message: "Add tasks and projects to receive AI insights.",
          icon: Brain,
          color: "text-purple-500",
          priority: "low",
        },
      ]);
      setLoading(false);
    } else {
      fetchInsights();
    }
  }, [tasks, projects, isDataReady]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center justify-center">
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
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-start space-x-3">
              <insight.icon className={`h-5 w-5 ${insight.color}`} />
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {insight.title}
                  </h4>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100">
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
