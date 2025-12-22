import React, { useState, useEffect } from "react";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import {
  BarChart3,
  CheckSquare,
  FileText,
  Clock,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import AIInsights from "../components/dashboard/AIInsights";

const getStatusStyles = (status, type = "project") => {
  if (type === "project") {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  }
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "in-progress":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

function StatCard({ icon: Icon, title, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

const QuickAction = ({ icon: Icon, title, description, onClick, color }) => (
  <button
    onClick={onClick}
    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all hover:scale-105 text-left w-full"
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center mb-2">
          <div className={`p-2 rounded-lg ${color} mr-3`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <ArrowRight className="h-5 w-5 text-gray-400" />
    </div>
  </button>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalProjects: 0,
    totalTasks: 0,
    totalDocuments: 0,
    pendingTasks: 0,
    recentProjects: [],
    recentTasks: [],
    allProjects: [],
    allTasks: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get("/dashboard/stats");

        const { projects, tasks, ...stats } = response.data;
        setDashboardData({
          ...stats,
          allProjects: projects,
          allTasks: tasks,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast.error("Couldn't load dashboard data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Here is what happening with your projects today.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={BarChart3}
            title="Total Projects"
            value={dashboardData.totalProjects}
            color="bg-blue-500"
          />
          <StatCard
            icon={CheckSquare}
            title="Total Tasks"
            value={dashboardData.totalTasks}
            color="bg-green-500"
          />
          <StatCard
            icon={FileText}
            title="Documents"
            value={dashboardData.totalDocuments}
            color="bg-purple-500"
          />
          <StatCard
            icon={Clock}
            title="Pending Tasks"
            value={dashboardData.pendingTasks}
            color="bg-orange-500"
          />
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickAction
              icon={Plus}
              title="Create Project"
              description="Start a new research project"
              onClick={() => (window.location.href = "/projects")}
              color="bg-blue-500"
            />
            <QuickAction
              icon={CheckSquare}
              title="Add Task"
              description="Create a new task for your team"
              onClick={() => (window.location.href = "/tasks")}
              color="bg-green-500"
            />
            <QuickAction
              icon={FileText}
              title="Upload Document"
              description="Add documents for AI analysis"
              onClick={() => (window.location.href = "/documents")}
              color="bg-purple-500"
            />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Projects
            </h3>
            <div className="space-y-4">
              {dashboardData.recentProjects.length > 0 ? (
                dashboardData.recentProjects.map((project) => (
                  <div
                    key={project._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {project.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {project.description}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyles(
                        project.status,
                        "project"
                      )}`}
                    >
                      {project.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No recent projects to show.
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Tasks
            </h3>
            <div className="space-y-4">
              {dashboardData.recentTasks.length > 0 ? (
                dashboardData.recentTasks.map((task) => (
                  <div
                    key={task._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {task.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {task.project?.title || "General"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyles(
                        task.status,
                        "task"
                      )}`}
                    >
                      {task.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  You are all caught up on tasks!
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8">
          <AIInsights
            projects={dashboardData.allProjects}
            tasks={dashboardData.allTasks}
          />
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
