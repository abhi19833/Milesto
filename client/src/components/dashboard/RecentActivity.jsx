import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Upload, UserPlus, AlertCircle } from "lucide-react";

const RecentActivity = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    const icons = {
      task_completed: CheckCircle,
      document_uploaded: Upload,
      team_invited: UserPlus,
    };
    return icons[type] || AlertCircle;
  };

  const getActivityColor = (type) => {
    const colors = {
      task_completed: "text-green-500",
      document_uploaded: "text-blue-500",
      team_invited: "text-purple-500",
    };
    return colors[type] || "text-gray-500";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <button
          type="button"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          View All
        </button>
      </div>

      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <motion.div
                key={activity.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex items-start space-x-3"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {activity.avatar || "?"}
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Icon
                      className={`h-4 w-4 ${getActivityColor(activity.type)}`}
                    />
                    <p className="text-sm text-gray-900">{activity.message}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.timestamp || "Just now"}
                  </p>
                </div>
              </motion.div>
            );
          })
        ) : (
          <p className="text-sm text-gray-500">No recent activity.</p>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
