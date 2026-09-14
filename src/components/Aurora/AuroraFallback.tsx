import { memo } from "react";

const FALLBACK_SVG = (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 1200 800"
    preserveAspectRatio="xMidYMid slice"
    className="h-full w-full"
  >
    <defs>
      <linearGradient
        id="aurora-fallback-grad"
        x1="0%"
        y1="0%"
        x2="100%"
        y2="0%"
      >
        <stop offset="0%" stopColor="#1E1B4B" stopOpacity={0.95} />
        <stop offset="30%" stopColor="#312E81" stopOpacity={0.9} />
        <stop offset="65%" stopColor="#6667AB" stopOpacity={0.85} />
        <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.8} />
      </linearGradient>
    </defs>

    <path
      d="M-123.067,304.67C-55.878,295.441 97.198,149.062 145.688,165.364C280.48,210.683 271.179,477.521 432.975,381.914C550.435,267.138 540.913,226.572 610.485,198.264C639.431,186.486 648.906,203.851 748.676,142.818C832.908,169.758 903.936,250.718 903.936,250.718C903.936,250.718 996.689,191.679 1027.145,216.872C1195.019,355.738 1324.862,396.416 1382.176,367.759L1400,-100L-100,-100L-123.067,304.67Z"
      fill="url(#aurora-fallback-grad)"
    />
  </svg>
);

function AuroraFallback() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden bg-[#0a0a0a]"
    >
      <div className="h-full w-full scale-110 opacity-90 blur-3xl">
        {FALLBACK_SVG}
      </div>
    </div>
  );
}

export default memo(AuroraFallback);
