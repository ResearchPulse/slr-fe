import React, { useState, useRef, useEffect } from "react";
import { FiBell } from "react-icons/fi";
import { useUnreadCount } from "../../hooks/useNotifications";
import NotificationDropdown from "../layout/NotificationDropdown";

const AdminNotification: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useUnreadCount();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={showNotifications}
        onClick={() => setShowNotifications(!showNotifications)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
          showNotifications
            ? "bg-primary-light text-accent"
            : "text-text-secondary hover:bg-primary-light hover:text-accent"
        }`}
      >
        <FiBell size={19} />
        {unreadCount > 0 && (
          <span className="absolute right-[7px] top-[7px] h-2 w-2 rounded-full border-2 border-white bg-rose-500" />
        )}
      </button>

      {showNotifications && <NotificationDropdown disableNavigation={true} />}
    </div>
  );
};

export default AdminNotification;
