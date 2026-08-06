import React from "react";

interface BrandLogomarkProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "custom";
  widthClass?: string;
  heightClass?: string;
}

export const BrandLogomark: React.FC<BrandLogomarkProps> = ({
  className = "",
  size = "md",
  widthClass,
  heightClass,
}) => {
  // Determine dimensions and rounding based on size
  let dimensions = "w-8 h-11 rounded-[10px]";
  let textSize = "text-xl pb-0.5";

  if (size === "sm") {
    dimensions = "w-6 h-8 rounded-[8px]";
    textSize = "text-sm pb-0.5";
  } else if (size === "lg") {
    dimensions = "w-12 h-16 rounded-[14px]";
    textSize = "text-3xl pb-1";
  } else if (size === "xl") {
    dimensions = "w-24 h-32 rounded-[28px]";
    textSize = "text-6xl pb-2";
  } else if (size === "custom") {
    dimensions = `${widthClass || "w-8"} ${heightClass || "h-11"} rounded-xl`;
    textSize = "text-xl pb-0.5";
  }

  return (
    <div
      id="brand-logomark-pill"
      className={`relative inline-flex items-center justify-center bg-[#C8F169] select-none text-center group transition-all duration-200 border border-[#043F2E]/5 ${dimensions} ${className}`}
      style={{
        boxShadow: "0px 4px 12px rgba(4, 63, 46, 0.12)",
      }}
    >
      {/* Editorial cursive lowercase 'b' in Newsreader (font-display) */}
      <span className={`font-display italic font-medium text-[#043F2E] leading-none select-none ${textSize}`}>
        b
      </span>
    </div>
  );
};

interface BrandWordmarkProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const BrandWordmark: React.FC<BrandWordmarkProps> = ({
  className = "",
  size = "md",
}) => {
  let textSize = "text-2xl";

  if (size === "sm") {
    textSize = "text-lg";
  } else if (size === "lg") {
    textSize = "text-3xl md:text-4xl";
  } else if (size === "xl") {
    textSize = "text-5xl md:text-6xl";
  }

  return (
    <span
      id="brand-wordmark-editorial"
      className={`font-display font-medium italic text-[#043F2E] tracking-tight select-none ${textSize} ${className}`}
    >
      Befakor
    </span>
  );
};
