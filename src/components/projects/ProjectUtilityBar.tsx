import React from "react";
import { FiSearch } from "react-icons/fi";
import Input from "../ui/Input";

interface ProjectUtilityBarProps {
  onSearchChange: (value: string) => void;
}

const ProjectUtilityBar: React.FC<ProjectUtilityBarProps> = ({
  onSearchChange,
}) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border bg-bg-primary sticky top-0 z-10 px-6">
      {/* Search Input */}
      <div className="relative w-72">
        <FiSearch
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          size={14}
        />
        <Input
          placeholder="Search projects..."
          className="pl-9 h-9 bg-surface-white border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-xl text-sm"
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Page Title (Centered) */}
      <div className="flex-1 flex justify-center">
        <h1 className="text-[11px] uppercase tracking-[0.25em] font-medium text-text-secondary">
          My Projects
        </h1>
      </div>

      {/* Right Slot (balance) */}
      <div className="w-72 hidden md:block"></div>
    </div>
  );
};

export default ProjectUtilityBar;
