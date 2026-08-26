"use client";

import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import RepairCategoriesManager from "../repair-categories/RepairCategoriesManager";
import BrandsManager from "../brands/BrandsManager";
import DevicesManager from "../devices/DevicesManager";
import DeviceServicesManager from "../device-services/DeviceServicesManager";
import RepairServicesManager from "./RepairServicesManager";

type Tab =
  | "categories"
  | "brands"
  | "devices"
  | "service-templates"
  | "device-services";

const TABS: [Tab, string][] = [
  ["categories", "Categories"],
  ["brands", "Brands"],
  ["devices", "Devices"],
  ["service-templates", "Service templates"],
  ["device-services", "Device services"],
];

function normalizeTab(value?: string): Tab {
  const match = TABS.find(([key]) => key === value);
  return match ? match[0] : "categories";
}

export default function RepairServicesAdmin({ initialTab }: { initialTab?: string }) {
  const [tab, setTab] = useState<Tab>(() => normalizeTab(initialTab));

  return (
    <AdminShell
      eyebrow="Repair catalog"
      title="Repair services"
      lead="Everything behind the repair booking flow — categories, brands, devices, service templates and per-device pricing."
    >
      <div className="repair-admin">
        <div className="admin-tabs" role="tablist" aria-label="Repair services sections">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={`admin-tab${tab === key ? " admin-tab--active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "categories" && <RepairCategoriesManager />}
        {tab === "brands" && <BrandsManager />}
        {tab === "devices" && <DevicesManager />}
        {tab === "service-templates" && <RepairServicesManager />}
        {tab === "device-services" && <DeviceServicesManager />}
      </div>
    </AdminShell>
  );
}
