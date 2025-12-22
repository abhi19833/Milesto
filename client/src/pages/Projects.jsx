import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  FileText,
  CheckSquare,
  Edit3,
  Trash2,
  BarChart3,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axiosInstance";

const API_URL = "/projects";

const STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  "on-hold": "bg-yellow-100 text-yellow-800",
  planning: "bg-gray-100 text-gray-800",
};

const initialProjectFormState = {
  title: "",
  description: "",
  status: "planning",
};

const ProjectCard = ({ project, onDelete, onEdit }) => {
  const statusColor = STATUS_COLORS[project.status] || STATUS_COLORS.planning;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex-grow">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-semibold text-gray-900 mb-2 flex-1 pr-2">
            {project.title}
          </h3>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColor}`}
          >
            {project.status}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {project.description || "No description provided"}
        </p>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1.5" />
            {new Date(project.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1.5" />
            {project.teamMembers?.length || 0} members
          </div>
          <div className="flex items-center">
            <CheckSquare className="h-4 w-4 mr-1.5" />
            {project.taskCount || 0} tasks
          </div>
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-1.5" />
            {project.documentCount || 0} docs
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(project)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(project._id)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState(initialProjectFormState);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await api.get(API_URL);
        setProjects(data);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        toast.error("Could not load your projects.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const resetAndCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    setProjectForm(initialProjectFormState);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (editingProject) {
      try {
        const { data: updatedProject } = await api.put(
          `${API_URL}/${editingProject._id}`,
          projectForm
        );
        setProjects(
          projects.map((p) =>
            p._id === updatedProject._id ? updatedProject : p
          )
        );
        resetAndCloseModal();
        toast.success("Project updated!");
      } catch (error) {
        console.error("Error updating project:", error);
        toast.error("Failed to update project.");
      }
    } else {
      try {
        const { data: newProject } = await api.post(API_URL, {
          ...projectForm,
          description: projectForm.description || "",
        });
        setProjects((prevProjects) => [newProject, ...prevProjects]);
        resetAndCloseModal();
        toast.success("Project created!");
      } catch (error) {
        console.error("Error creating project:", error);
        toast.error("Failed to create project.");
      }
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      await api.delete(`${API_URL}/${projectId}`);
      setProjects(projects.filter((p) => p._id !== projectId));
      toast.success("Project deleted.");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project.");
    }
  };

  const handleEditClick = (project) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title,
      description: project.description,
      status: project.status,
    });
    setIsModalOpen(true);
  };
  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      const searchMatch =
        proj.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (proj.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const statusMatch =
        statusFilter === "all" || proj.status === statusFilter;

      return searchMatch && statusMatch;
    });
  }, [projects, searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-2">
              Manage your projects with your team
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                onDelete={handleDeleteProject}
                onEdit={handleEditClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No projects found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Get started by creating your first project."}
            </p>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {editingProject ? "Edit Project" : "Create New Project"}
                </h3>
                <button
                  onClick={resetAndCloseModal}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Title
                    </label>
                    <input
                      type="text"
                      value={projectForm.title}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={projectForm.description}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={projectForm.status}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          status: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="on-hold">On Hold</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={resetAndCloseModal}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    {editingProject ? "Save Changes" : "Create Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
