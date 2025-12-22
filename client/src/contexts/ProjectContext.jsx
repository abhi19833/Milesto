import React, { createContext, useContext, useState } from "react";
import toast from "react-hot-toast";

const ProjectContext = createContext();

export const useProject = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error("useProject must be used inside ProjectProvider");
  }
  return ctx;
};

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);

      setProjects([]);
    } catch (err) {
      toast.error("Could not load projects");
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (data) => {
    try {
      setLoading(true);
      const newProject = {
        _id: Date.now().toString(),
        ...data,
        createdAt: new Date().toISOString(),
        progress: 0,
        tasks: 0,
        completedTasks: 0,
        teamMembers: [],
      };
      setProjects((prev) => [...prev, newProject]);
      toast.success("Project created");
      return newProject;
    } catch (err) {
      toast.error("Failed to create project");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (id, updates) => {
    try {
      setLoading(true);
      const updated = {
        ...projects.find((p) => p._id === id),
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      setProjects((prev) => prev.map((p) => (p._id === id ? updated : p)));
      if (currentProject?._id === id) setCurrentProject(updated);
      toast.success("Project updated");
      return updated;
    } catch (err) {
      toast.error("Failed to update project");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id) => {
    try {
      setLoading(true);
      setProjects((prev) => prev.filter((p) => p._id !== id));
      if (currentProject?._id === id) setCurrentProject(null);
      toast.success("Project deleted");
    } catch (err) {
      toast.error("Failed to delete project");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProject = async (id) => {
    try {
      setLoading(true);
      const project = projects.find((p) => p._id === id);
      if (!project) throw new Error("Project not found");
      setCurrentProject(project);
      return project;
    } catch (err) {
      toast.error("Could not fetch project");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProjectProgress = (id, progress) => {
    setProjects((prev) =>
      prev.map((p) => (p._id === id ? { ...p, progress } : p))
    );
    if (currentProject?._id === id) {
      setCurrentProject((prev) => ({ ...prev, progress }));
    }
  };

  const addTeamMember = async (projectId, member) => {
    try {
      const project = projects.find((p) => p._id === projectId);
      if (!project) return;
      const updated = {
        ...project,
        teamMembers: [
          ...project.teamMembers,
          { ...member, id: Date.now().toString() },
        ],
      };
      setProjects((prev) =>
        prev.map((p) => (p._id === projectId ? updated : p))
      );
      toast.success("Team member added");
    } catch {
      toast.error("Failed to add member");
    }
  };

  const value = {
    projects,
    currentProject,
    loading,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    updateProjectProgress,
    addTeamMember,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};
