import React from "react";

interface SolanaLogoProps {
  className?: string;
  size?: number;
}

export const SolanaLogo: React.FC<SolanaLogoProps> = ({
  className = "w-4 h-4",
  size,
}) => {
  return (
    <div
      style={size ? { width: size, height: size } : undefined}
      className={`relative inline-flex items-center justify-center rounded-full bg-[#14141e] border border-white/10 p-0.5 shrink-0 overflow-hidden shadow-inner ${className}`}
    >
      <svg
        viewBox="0 0 397 311"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain p-[1px]"
      >
        <path
          d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z"
          fill="url(#sol_grad_1)"
        />
        <path
          d="M64.6 3.8C67 1.4 70.3 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z"
          fill="url(#sol_grad_2)"
        />
        <path
          d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"
          fill="url(#sol_grad_3)"
        />
        <defs>
          <linearGradient
            id="sol_grad_1"
            x1="394.5"
            y1="234.1"
            x2="18.9"
            y2="310.8"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#00FFA3" />
            <stop offset="1" stopColor="#DC1FFF" />
          </linearGradient>
          <linearGradient
            id="sol_grad_2"
            x1="394.5"
            y1="0"
            x2="18.9"
            y2="76.7"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#00FFA3" />
            <stop offset="1" stopColor="#DC1FFF" />
          </linearGradient>
          <linearGradient
            id="sol_grad_3"
            x1="4.1"
            y1="116.3"
            x2="379.7"
            y2="193"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#00FFA3" />
            <stop offset="1" stopColor="#DC1FFF" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
