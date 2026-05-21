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
    <div className="flex items-center justify-between py-3 border-b border-[#D8D2C8] bg-[#F4F0E8] sticky top-0 z-10 px-6">
      {/* Search Input */}
      <div className="relative w-72">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0998C]" size={14} />
        <Input
          placeholder="Search projects..."
          className="pl-9 h-9 bg-[#FDFCF9] border-[#D8D2C8] focus:border-[#5B0000] focus:ring-1 focus:ring-[#5B0000] rounded-[4px] text-sm"
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Page Title (Centered) */}
      <div className="flex-1 flex justify-center">
        <h1 className="text-[11px] uppercase tracking-[0.25em] font-medium text-[#5C5C5C]">
          My Projects
        </h1>
      </div>

      {/* Right Slot (balance) */}
      <div className="w-72 hidden md:block"></div>
    </div>
  );
};

export default ProjectUtilityBar;
