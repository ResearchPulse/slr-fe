import React from "react";
import ProjectExclusionCodeTab from "../../components/admin/settings/ProjectExclusionCodeTab";

const SystemSettings: React.FC = () => (
  <div className="mx-auto max-w-[1600px] space-y-6 pb-2">
    <header>
      <h1 className="text-[28px] font-semibold tracking-tight text-text-primary">
        System Settings
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Manage settings shared across SLR projects.
      </p>
    </header>

    <ProjectExclusionCodeTab />
  </div>
);

export default SystemSettings;
