import React, { useState, useMemo, useEffect } from "react";
import {
  UserPlus,
  Mail,
  Calendar,
  Crown,
  Shield,
  User,
  Trash2,
} from "lucide-react";
import InviteModal from "../components/team/InviteModal";
import { useTeam } from "../contexts/TeamContext";

const TeamMemberRow = ({ member, onRemove, getRoleIcon, getRoleColor }) => (
  <div className="px-6 py-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
    <div className="flex items-center">
      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium mr-4">
        {member.name.charAt(0).toUpperCase()}
      </div>
      <div>
        <h3 className="font-medium text-gray-900">{member.name}</h3>
        <p className="text-sm text-gray-600">{member.email}</p>
        <div className="flex items-center mt-1 text-xs text-gray-500">
          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
          Joined {new Date(member.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
    <div className="flex items-center space-x-3">
      <div className="flex items-center">
        {getRoleIcon(member.role)}
        <span
          className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
            member.role
          )}`}
        >
          {member.role}
        </span>
      </div>
      <button
        onClick={() => onRemove(member.id)}
        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const InvitationRow = ({ invitation, onCancel }) => (
  <div className="px-6 py-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
    <div className="flex items-center">
      <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-medium mr-4">
        <Mail className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-medium text-gray-900">{invitation.email}</h3>
        <p className="text-sm text-gray-600">Invitation pending</p>
        <div className="flex items-center mt-1 text-xs text-gray-500">
          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
          Invited {new Date(invitation.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
    <div className="flex items-center space-x-3">
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        {invitation.role}
      </span>
      <button
        onClick={() => onCancel(invitation.id)}
        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const Team = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);

  const {
    teamMembers,

    projects,
    fetchTeamMembers,
    fetchInvitations,
    fetchProjects,
    removeTeamMember,
  } = useTeam();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetchTeamMembers();
    fetchInvitations();
    fetchProjects();
  }, []);

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case "moderator":
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-yellow-100 text-yellow-800";
      case "moderator":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredMembers = useMemo(
    () =>
      (teamMembers || []).filter(
        (m) =>
          m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.email.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [teamMembers, searchTerm]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team</h1>
            <p className="text-gray-600 mt-2">
              Manage your team members and collaborate effectively
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Invite
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="divide-y divide-gray-200">
            {filteredMembers.map((member) => (
              <TeamMemberRow
                key={member.id}
                member={member}
                onRemove={removeTeamMember}
                getRoleIcon={getRoleIcon}
                getRoleColor={getRoleColor}
              />
            ))}
          </div>
        </div>

        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          projects={projects}
        />
      </div>
    </div>
  );
};

export default Team;
