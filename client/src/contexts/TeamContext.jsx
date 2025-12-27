import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import toast from "react-hot-toast";
import api from "../api/axiosInstance";
import { useAuth } from "./AuthContext";

const TeamContext = createContext();

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) throw new Error("useTeam must be used within a TeamProvider");
  return context;
};

export const TeamProvider = ({ children }) => {
  const { user, loading } = useAuth();

  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);

  const fetchTeamMembers = useCallback(async () => {
    try {
      const response = await api.get("/team/members");
      setTeamMembers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch team members"
      );
    }
  }, []);

  const fetchInvitations = useCallback(async () => {
    try {
      const response = await api.get("/team/invitations");
      setInvitations(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch invitations"
      );
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await api.get("/projects");
      setProjects(
        Array.isArray(response.data)
          ? response.data
          : response.data.projects || []
      );
    } catch (error) {
      toast.error("Failed to fetch projects");
    }
  }, []);

  const inviteTeamMember = useCallback(
    async (email, projectId, role = "member", message = "") => {
      await api.post("/team/invite", {
        email,
        projectId,
        role,
        message,
      });
      fetchTeamMembers();
      fetchInvitations();
    },
    [fetchTeamMembers, fetchInvitations]
  );

  const acceptInvitation = useCallback(
    async (invitationId) => {
      await api.post(`/team/invitations/${invitationId}/accept`);
      fetchTeamMembers();
      fetchInvitations();
    },
    [fetchTeamMembers, fetchInvitations]
  );

  const cancelInvitation = useCallback(async (invitationId) => {
    await api.delete(`/team/invitations/${invitationId}`);
    setInvitations((prev) => prev.filter((i) => i._id !== invitationId));
  }, []);

  const removeTeamMember = useCallback(async (memberId) => {
    await api.delete(`/team/members/${memberId}`);
    setTeamMembers((prev) => prev.filter((m) => m._id !== memberId));
  }, []);

  const updateMemberRole = useCallback(async (memberId, role) => {
    await api.patch(`/team/members/${memberId}`, { role });

    setTeamMembers((prev) =>
      prev.map((m) => (m._id === memberId ? { ...m, role } : m))
    );
  }, []);
  useEffect(() => {
    if (!loading && user) {
      fetchTeamMembers();
      fetchInvitations();
      fetchProjects();
    }
  }, [loading, user]);

  const value = {
    projects,
    teamMembers,
    invitations,
    fetchProjects,
    fetchTeamMembers,
    fetchInvitations,
    inviteTeamMember,
    acceptInvitation,
    cancelInvitation,
    removeTeamMember,
    updateMemberRole,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};
