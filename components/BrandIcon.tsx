type IconName =
  | "phone"
  | "mail"
  | "location"
  | "clock"
  | "note"
  | "chat"
  | "wrench"
  | "package"
  | "screen"
  | "battery"
  | "water"
  | "port"
  | "camera"
  | "settings"
  | "laptop"
  | "tablet";

const paths: Record<IconName, string> = {
  phone: "M9 4h4l2 6-3 2c1.5 3.2 4.3 6 7.5 7.5l2-3 6 2v4c0 2.2-1.8 4-4 4C13.4 26.5 5.5 18.6 5.5 8.5c0-2.5 1.1-4.5 3.5-4.5Z",
  mail: "M4 6h24v18H4z M4 7l12 9L28 7",
  location: "M16 29s9-8 9-15a9 9 0 1 0-18 0c0 7 9 15 9 15Zm0-12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  clock: "M16 28a12 12 0 1 0 0-24 12 12 0 0 0 0 24Zm0-18v7l5 3",
  note: "M7 4h18v24H7z M11 9h10 M11 14h10 M11 19h6",
  chat: "M5 6h22v15H12l-6 5v-5H5z",
  wrench: "m22 5-4 4 5 5 4-4a7 7 0 0 1-9 9L8 29a3 3 0 1 1-4-4l13-10a7 7 0 0 1 5-10Z",
  package: "m16 3 12 6v14l-12 6L4 23V9l12-6Zm0 0v14m12-8-12 6L4 9m12 8v12",
  screen: "M4 5h24v17H4z M11 27h10 M16 22v5",
  battery: "M6 8h20v16H6z M26 13h3v6h-3 M10 12v8 M14 12v8 M18 12v8",
  water: "M16 3S7 13 7 19a9 9 0 0 0 18 0c0-6-9-16-9-16Z",
  port: "M9 5v8a7 7 0 0 0 14 0V5 M12 5v5 M20 5v5 M16 20v8 M12 24h8",
  camera: "M5 9h6l2-3h6l2 3h5v16H5z M16 21a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
  settings: "M13 4h6l1 4 3 2 4-1 3 5-3 3v4l3 3-3 5-4-1-3 2-1 4h-6l-1-4-3-2-4 1-3-5 3-3v-4l-3-3 3-5 4 1 3-2 1-4Zm3 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  laptop: "M5 6h22v15H5z M2 25h28 M10 25h12",
  tablet: "M7 3h18v26H7z M15 25h2",
};

export default function BrandIcon({ name }: { name: IconName }) {
  return (
    <svg className="brand-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d={paths[name]} />
    </svg>
  );
}

export type { IconName };
