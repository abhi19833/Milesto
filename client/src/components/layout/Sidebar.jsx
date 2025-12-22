import React from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  FileText,
  Users,
  Settings,
  X,
} from "lucide-react";

const Sidebar = ({ isOpen, onClose }) => {
  const navigation = [
    { name: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", to: "/projects", icon: FolderOpen },
    { name: "Tasks", to: "/tasks", icon: CheckSquare },
    { name: "Documents", to: "/documents", icon: FileText },
    { name: "Team", to: "/team", icon: Users },
    { name: "Settings", to: "/settings", icon: Settings },
  ];

  const sidebarVariants = {
    open: {
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    closed: {
      x: "-100%",
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  };

  const brandName = "Milesto";
  const brandLetter = brandName.charAt(0).toUpperCase();

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.div
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        className="fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg lg:static lg:inset-0 lg:translate-x-0"
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
              <span className="text-lg font-bold text-white">
                {brandLetter}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{brandName}</h1>
          </div>
          <button
            onClick={onClose}
            className=" transition-colors hover:bg-gray-100 hover:text-gray-600 lg:hidden rounded-md p-2 text-gray-400"
            aria-label="Close sidebar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8">
          <div className="space-y-1 px-2">
            {navigation.map(({ name, to, icon: Icon }) => (
              <NavLink
                key={name}
                to={to}
                className={({ isActive }) =>
                  `group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
                onClick={() => window.innerWidth < 1024 && onClose()}
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <span>{name}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </motion.div>
    </>
  );
};

export default Sidebar;
