"use client";

import { ClipboardText, Package, Tag } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

export type AdminTabKey = "orders" | "catalogue" | "categories";

interface TabDefinition<K extends string> {
  key: K;
  label: string;
  icon: Icon;
}

const TABS: readonly TabDefinition<AdminTabKey>[] = [
  { key: "orders", label: "Orders", icon: ClipboardText },
  { key: "catalogue", label: "Catalogue", icon: Package },
  { key: "categories", label: "Categories", icon: Tag },
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
          <tab.icon size={16} weight="bold" aria-hidden="true" />
          {tab.label}
        </button>
      ))}
    </div>
  );
}
