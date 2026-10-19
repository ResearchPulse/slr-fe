import React, { useState } from "react";
import Tabs, { type TabItem } from "../../../../components/ui/Tabs";
import { FiList } from "react-icons/fi";
import ProcessExclusionCodeTab from "../../../../components/reviewProcess/leader/settings/ProcessExclusionCodeTab";

const ProcessSettingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("exclusion-code");

  const tabItems: TabItem[] = [
    {
      id: "exclusion-code",
      label: "Exclusion code",
      icon: FiList,
    },
  ];

  return (
    <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150 motion-reduce:animate-none">
      <Tabs items={tabItems} activeTabId={activeTab} onTabChange={setActiveTab}>
        <div className="bg-surface-white rounded-xl border border-border shadow-[0_20px_50px_rgba(0,0,0,0.02)] overflow-hidden min-h-[500px]">
          {activeTab === "exclusion-code" && <ProcessExclusionCodeTab />}
        </div>
      </Tabs>
    </div>
  );
};

export default ProcessSettingPage;
