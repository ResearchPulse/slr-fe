import React, { useState } from "react";
import {
  HiOutlineAtSymbol,
  HiOutlineLink,
} from "react-icons/hi";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- NotesTabs Component ---
const tabs = ["Notes", "Your Mentions", "All Mentions"];

const NotesTabs: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
}> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex border-b border-border-default px-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={cn(
            "px-4 py-3 text-sm font-medium transition-colors relative",
            activeTab === tab
              ? "text-accent"
              : "text-text-muted hover:text-text-main",
          )}
        >
          {tab}
          {activeTab === tab && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};

// --- CommentEditor Component ---
const CommentEditor: React.FC = () => {
  return (
    <div className="p-4 border-t border-border-default bg-surface-card sticky bottom-0">
      <div className="border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-accent/20 transition-all">
        <div className="flex items-center gap-1 p-2 border-b border-border bg-bg-primary">
          <button className="p-1 hover:bg-white rounded text-xs font-bold w-6 h-6 flex items-center justify-center">
            B
          </button>
          <button className="p-1 hover:bg-white rounded text-xs italic w-6 h-6 flex items-center justify-center">
            i
          </button>
          <button className="p-1 hover:bg-white rounded text-xs underline w-6 h-6 flex items-center justify-center">
            U
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button className="p-1 hover:bg-white rounded text-text-muted">
            <HiOutlineAtSymbol className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-white rounded text-text-muted">
            <HiOutlineLink className="w-4 h-4" />
          </button>
        </div>
        <textarea
          placeholder="Write a comment..."
          className="w-full p-4 text-sm bg-transparent border-none focus:ring-0 resize-none h-24"
        />
        <div className="flex justify-end p-2 border-t border-border">
          <button className="px-4 py-1.5 bg-bg-secondary text-text-muted rounded-full text-xs font-semibold cursor-not-allowed">
            Comment
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main NotesPanel Component ---
const NotesPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Notes");

  return (
    <div className="flex flex-col h-full bg-surface-card">
      <NotesTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto">
        {activeTab === "Notes" ? (
          <div className="p-8 text-center text-text-muted text-sm italic">
            No notes yet.
          </div>
        ) : (
          <div className="p-8 text-center text-text-muted text-sm italic">
            No mentions found.
          </div>
        )}
      </div>

      <CommentEditor />
    </div>
  );
};

export default NotesPanel;
