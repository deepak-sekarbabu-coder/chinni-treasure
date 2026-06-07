"use client";

export type AdminTabKey = "orders" | "catalogue";

interface TabDefinition<K extends string> {
  key: K;
  label: string;
  icon: string;
}

const TABS: readonly TabDefinition<AdminTabKey>[] = [
  { key: "orders", label: "Orders", icon: "\u{1F4CB}" },
  { key: "catalogue", label: "Catalogue", icon: "\u{1F4E6}" },
];

interface Props {
  activeTab: AdminTabKey;
  onTabChange: (tab: AdminTabKey) => void;
}

export default function AdminTabs({ activeTab, onTabChange }: Props) {
  return (
    <div role="tablist" className="admin-tab-buttons flex gap-8 mb-32">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          id={`tab-${tab.key}`}
          role="tab"
          type="button"
          aria-selected={activeTab === tab.key}
          aria-controls={`panel-${tab.key}`}
          className={`btn capitalize ${activeTab === tab.key ? "btn-primary" : "btn-secondary"} btn-lg`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
}
