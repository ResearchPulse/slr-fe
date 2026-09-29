// Alerts Card Component

import { FiAlertTriangle } from "react-icons/fi";
import type { Alert } from "../../types/reviewProcessWorkspace";

interface AlertsCardProps {
  alerts: Alert[];
}

export default function AlertsCard({ alerts }: AlertsCardProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface-white border border-border rounded-[4px] p-6 shadow-none">
      <h3 className="font-cormorant text-xl font-normal text-text-primary mb-4 flex items-center gap-2">
        <FiAlertTriangle className="w-5 h-5 text-warning" />
        Alerts
      </h3>
      <div className="space-y-4 text-[13px]">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex gap-3 items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0 opacity-80" />
            <p className="text-text-secondary leading-relaxed">
              {alert.highlight && (
                <span className="font-medium text-text-primary">
                  {alert.highlight}
                </span>
              )}{" "}
              {alert.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
