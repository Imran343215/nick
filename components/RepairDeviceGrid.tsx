import Link from "next/link";
import type { DeviceShape } from "@/lib/repair-catalog";

export default function RepairDeviceGrid({
  devices,
  brandSlug,
}: {
  devices: DeviceShape[];
  brandSlug: string;
}) {
  return (
    <div className="repair-grid">
      {devices.map((device) => (
        <Link
          key={device._id}
          href={`/repair/${brandSlug}/${device.slug}`}
          className="repair-card repair-card--device"
        >
          <div className="repair-card__media">
            <img src={device.image} alt={device.name} />
          </div>
          <h3>{device.name}</h3>
        </Link>
      ))}
    </div>
  );
}
