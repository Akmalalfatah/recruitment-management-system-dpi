import { useState } from "react";
import logoDpi from "../../assets/logo_dpi.png";

export default function Logo({ size = 36, width, height, className = "" }) {
  const [failed, setFailed] = useState(false);
  const imageWidth = width ?? size;
  const imageHeight = height ?? size;

  if (failed) {
    return (
      <div
        style={{ width: imageWidth, height: imageHeight }}
        className={`flex items-center justify-center border-2 border-dashed border-ink-300 text-ink-300 text-[8px] font-bold uppercase leading-none text-center shrink-0 ${className}`}
      >
        Logo
      </div>
    );
  }

  return (
    <img
      src={logoDpi}
      alt="Logo Perusahaan"
      style={{ width: imageWidth, height: imageHeight }}
      className={`object-contain shrink-0 ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
