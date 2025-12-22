import React, { createContext, useContext, useState } from "react";
import toast from "react-hot-toast";

const TaskContext = createContext();

export const useTask = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) {
    throw new Error("useTask must be used inside TaskProvider");
  }
  return ctx;
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async (projectId) => {
    try {
      setLoading(true);

      setTasks([]);
    } catch (err) {
      toast.error("Could not load tasks");
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (data) => {
    try {
      setLoading(true);
      const newTask = {
        _id: Date.now().toString(),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        labels: data.labels || [],
      };
      setTasks((prev) => [...prev, newTask]);
      toast.success("Task created");
      return newTask;
    } catch (err) {
      toast.error("Failed to create task");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (id, updates) => {
    try {
      setLoading(true);
      const updated = {
        ...tasks.find((t) => t._id === id),
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
      toast.success("Task updated");
      return updated;
    } catch (err) {
      toast.error("Failed to update task");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id) => {
    try {
      setLoading(true);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      toast.success("Task deleted");
    } catch (err) {
      toast.error("Failed to delete task");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const moveTask = async (id, status) => {
    try {
      const updated = {
        ...tasks.find((t) => t._id === id),
        status,
        updatedAt: new Date().toISOString(),
      };
      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
      toast.success(`Task moved to ${status}`);
    } catch {
      toast.error("Failed to move task");
    }
  };

  const assignTask = async (id, assignee) => {
    try {
      const updated = {
        ...tasks.find((t) => t._id === id),
        assignee,
        updatedAt: new Date().toISOString(),
      };
      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
      toast.success(`Assigned to ${assignee.name}`);
    } catch {
      toast.error("Failed to assign task");
    }
  };

  const getTasksByStatus = (status) => tasks.filter((t) => t.status === status);
  const getTasksByProject = (projectId) =>
    tasks.filter((t) => t.projectId === projectId);
  const getOverdueTasks = () => {
    const today = new Date();
    return tasks.filter(
      (t) => t.status !== "done" && new Date(t.dueDate) < today
    );
  };

  const value = {
    tasks,
    loading,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    assignTask,
    getTasksByStatus,
    getTasksByProject,
    getOverdueTasks,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
