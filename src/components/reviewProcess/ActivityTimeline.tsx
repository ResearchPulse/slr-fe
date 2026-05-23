import {
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
  FiUser,
  FiActivity,
} from "react-icons/fi";

interface Activity {
  id: string;
  type:
    | "phase_started"
    | "phase_completed"
    | "record_added"
    | "screening_done"
    | "note_added"
    | "team_action";
  title: string;
  description?: string;
  timestamp: string;
  user?: string;
  phaseRelated?: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

const getActivityIcon = (type: Activity["type"]) => {
  switch (type) {
    case "phase_started":
      return <FiActivity className="w-5 h-5 text-blue-600" />;
    case "phase_completed":
      return <FiCheckCircle className="w-5 h-5 text-green-600" />;
    case "record_added":
      return <FiFileText className="w-5 h-5 text-purple-600" />;
    case "screening_done":
      return <FiCheckCircle className="w-5 h-5 text-teal-600" />;
    case "note_added":
      return <FiAlertCircle className="w-5 h-5 text-yellow-600" />;
    case "team_action":
      return <FiUser className="w-5 h-5 text-accent" />;
    default:
      return <FiClock className="w-5 h-5 text-text-secondary" />;
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60),
  );

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  }
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  }
  if (diffInHours < 48) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

export default function ActivityTimeline({
  activities,
}: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-surface-white border border-border rounded-[4px] p-8">
        <div className="text-center text-text-secondary">
          <FiClock className="w-12 h-12 mx-auto mb-3 text-text-secondary" />
          <p className="text-sm">No recent activities</p>
          <p className="text-xs text-text-secondary mt-1">
            Activities will appear here as you work
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-white border border-border rounded-[4px] p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        <FiActivity className="w-5 h-5 text-blue-600" />
        Recent Activity
      </h3>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={activity.id} className="flex gap-4">
            {/* Timeline Line */}
            <div className="flex flex-col items-center">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-bg-primary border-2 border-border flex items-center justify-center">
                {getActivityIcon(activity.type)}
              </div>
              {index < activities.length - 1 && (
                <div className="w-0.5 flex-1 bg-bg-secondary mt-2 mb-2 min-h-[20px]" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-medium text-text-primary text-sm">
                  {activity.title}
                </h4>
                <span className="text-xs text-text-secondary flex-shrink-0 ml-4">
                  {formatTimestamp(activity.timestamp)}
                </span>
              </div>

              {activity.description && (
                <p className="text-sm text-text-secondary mb-2">
                  {activity.description}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-text-secondary">
                {activity.user && (
                  <span className="flex items-center gap-1">
                    <FiUser className="w-3 h-3" />
                    {activity.user}
                  </span>
                )}
                {activity.phaseRelated && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                    {activity.phaseRelated}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {activities.length > 5 && (
        <button className="w-full mt-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
          View all activities →
        </button>
      )}
    </div>
  );
}
