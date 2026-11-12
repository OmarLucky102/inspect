import { useId, useState } from 'react';
import { usePointerParallax } from '@/lib/use-pointer-parallax';

export interface ValidationConflictSvgProps {
  status: 400 | 409 | 422;
  className?: string;
  compact?: boolean;
}

/**
 * Interactive 400 / 409 / 422 SVG graphic matching the 401 & 403 error style:
 * - Bungee numerals (#2b2b2b + shadow + rim highlight) locked to LTR coordinates
 * - 400: Amber malformed-input warning core centered in the middle "0"
 * - 409: Dual opposing conflict vectors centered in the middle "0"
 * - 422: Calibration reticle and verification scan bar framing the middle "2"
 */
export function ValidationConflictSvg({
  status,
  className = '',
  compact = false,
}: ValidationConflictSvgProps) {
  const offset = usePointerParallax(3.2);
  const [isShaking, setIsShaking] = useState(false);

  const triggerPulse = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);
  };

  const uid = useId().replace(/:/g, '');
  const leftId = `vc-left-${uid}`;
  const midId = `vc-mid-${uid}`;
  const rightId = `vc-right-${uid}`;
  const boltId = `vc-bolt-${uid}`;
  const centerClipId = `vc-clip-${uid}`;

  const isConflict = status === 409;
  const isUnprocessable = status === 422;
  const beaconPrimary = isConflict ? '#f43f5e' : '#f59e0b';
  const beaconDim = isConflict ? '#be123c' : '#b45309';
  const rightDigit = isConflict ? '9' : isUnprocessable ? '2' : '0';

  return (
    <div
      dir="ltr"
      onClick={triggerPulse}
      className={`relative flex items-center justify-center select-none ${
        compact ? '' : 'w-full'
      } ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 260 124"
        role="img"
        aria-label={`HTTP ${status} Error Illustration`}
        style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}
        className={`validation-conflict-svg cursor-pointer ${
          compact
            ? 'h-24 sm:h-28 w-auto aspect-[260/124]'
            : 'w-[280px] sm:w-[400px] md:w-[460px] max-w-full h-auto aspect-[260/124]'
        } drop-shadow-xl transition-transform duration-300 hover:scale-[1.02]`}
      >
        <title>{`HTTP ${status}`}</title>

        <defs>
          <style>{`
            .vc-bungee {
              font-family: 'Bungee', cursive, sans-serif;
              font-weight: 400;
              font-style: normal;
              font-size: 106px;
              direction: ltr;
              unicode-bidi: bidi-override;
              text-anchor: middle;
            }
            @keyframes vcBeacon_${uid} {
              0%, 100% {
                fill: ${beaconPrimary};
                opacity: 1;
              }
              50% {
                fill: ${beaconDim};
                opacity: 0.45;
              }
            }
            @keyframes vcSpin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes vcScanY {
              0%, 100% { transform: translateY(-14px); opacity: 0.35; }
              50% { transform: translateY(14px); opacity: 0.95; }
            }
            @keyframes vcJitter {
              0%, 100% { transform: translateX(0); }
              20% { transform: translateX(-4px); }
              40% { transform: translateX(4px); }
              60% { transform: translateX(-2.5px); }
              80% { transform: translateX(2.5px); }
            }
            .vc-beacon {
              animation: vcBeacon_${uid} 1.2s ease-in-out infinite;
            }
            .vc-spin {
              transform-origin: 128px 70px;
              animation: vcSpin 16s linear infinite;
            }
            .vc-scan {
              animation: vcScanY 2.4s ease-in-out infinite;
            }
            .vc-jitter {
              animation: vcJitter 0.4s ease-in-out;
            }
          `}</style>

          <clipPath id={centerClipId}>
            <ellipse cx="128" cy="70" rx="18" ry="26" />
          </clipPath>

          <text
            id={leftId}
            className="vc-bungee"
            x={isUnprocessable ? '50' : '52'}
            y="106"
            textAnchor="middle"
            style={{
              direction: 'ltr',
              unicodeBidi: 'bidi-override',
              textAnchor: 'middle',
            }}
          >
            4
          </text>

          <text
            id={midId}
            className="vc-bungee"
            x="128"
            y="106"
            textAnchor="middle"
            style={{
              direction: 'ltr',
              unicodeBidi: 'bidi-override',
              textAnchor: 'middle',
            }}
          >
            2
          </text>

          <text
            id={rightId}
            className="vc-bungee"
            x={isUnprocessable ? '206' : '204'}
            y="106"
            textAnchor="middle"
            style={{
              direction: 'ltr',
              unicodeBidi: 'bidi-override',
              textAnchor: 'middle',
            }}
          >
            {rightDigit}
          </text>
        </defs>

        {/* Left "4" */}
        <use
          href={`#${leftId}`}
          x="-0.8"
          y="-1"
          fill="#000000"
          style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}
        />
        <use
          href={`#${leftId}`}
          fill="#2b2b2b"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="0.7"
          style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}
        />

        {/* Right Digit ("0", "9", or "2") */}
        <use
          href={`#${rightId}`}
          x="-0.8"
          y="-1"
          fill="#000000"
          style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}
        />
        <use
          href={`#${rightId}`}
          fill="#2b2b2b"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="0.7"
          style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}
        />

        {/* Center Interactive Module */}
        <g className={isShaking ? 'vc-jitter' : undefined}>
          {/* Top Telemetry Beacon Housing */}
          <path
            d="M 119 25 V 17 a 9 9 0 0 1 18 0 V 25"
            fill="#1f2937"
            stroke="#2b2b2b"
            strokeWidth="2"
          />
          <circle className="vc-beacon" cx="128" cy="16" r="3" />

          {isUnprocessable ? (
            <>
              {/* 422: Calibration frame & scanner around middle "2" */}
              <rect
                x="96"
                y="26"
                width="64"
                height="86"
                rx="14"
                fill="#111827"
                fillOpacity="0.12"
                stroke="#f59e0b"
                strokeWidth="1.4"
                strokeDasharray="6 4"
                strokeOpacity="0.6"
              />
              {/* Corner calibration brackets */}
              <path
                d="M 94 40 V 27 H 107 M 149 27 H 162 V 40 M 94 98 V 111 H 107 M 149 111 H 162 V 98"
                fill="none"
                stroke="#2aa7cc"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <use
                href={`#${midId}`}
                x="-0.8"
                y="-1"
                fill="#000000"
                style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}
              />
              <use
                href={`#${midId}`}
                fill="#2b2b2b"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="0.7"
                style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}
              />
              {/* Validation scanline & subtle cursor inspection loupe */}
              <g transform={`translate(${offset.dx}, ${offset.dy})`}>
                <circle
                  cx="128"
                  cy="68"
                  r="14"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.4"
                  strokeOpacity="0.75"
                />
                <circle cx="128" cy="68" r="2.2" fill="#f59e0b" />
              </g>
              <line
                className="vc-scan"
                x1="98"
                y1="69"
                x2="158"
                y2="69"
                stroke="#2aa7cc"
                strokeWidth="2"
                strokeOpacity="0.7"
              />
            </>
          ) : (
            <>
              {/* 400 & 409: Metallic "0" housing bezel */}
              <ellipse
                cx="127.2"
                cy="69"
                rx="23"
                ry="31"
                fill="#000000"
                stroke="#000000"
                strokeWidth="12"
              />
              <ellipse
                cx="128"
                cy="70"
                rx="23"
                ry="31"
                fill="#171b23"
                stroke="#2b2b2b"
                strokeWidth="12"
              />
              <ellipse
                cx="128"
                cy="70"
                rx="29"
                ry="37"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="0.8"
              />

              <g clipPath={`url(#${centerClipId})`}>
                <circle
                  className="vc-spin"
                  cx="128"
                  cy="70"
                  r="15.5"
                  fill="none"
                  stroke={isConflict ? '#f43f5e' : '#f59e0b'}
                  strokeWidth="1.6"
                  strokeDasharray="5 4"
                  strokeOpacity="0.8"
                />

                {isConflict ? (
                  /* 409: Opposing conflict arrows + spark core */
                  <g transform={`translate(${offset.dx}, ${offset.dy})`}>
                    <circle
                      cx="128"
                      cy="70"
                      r="11.5"
                      fill="#160f18"
                      stroke="#f43f5e"
                      strokeWidth="1.1"
                      strokeOpacity="0.45"
                    />
                    <path
                      d="M 114 66 H 124 L 120.5 62.5 M 124 66 L 120.5 69.5"
                      fill="none"
                      stroke="#2aa7cc"
                      strokeWidth="2.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M 142 74 H 132 L 135.5 70.5 M 132 74 L 135.5 77.5"
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="128" cy="70" r="2.1" fill="#fb7185" />
                  </g>
                ) : (
                  /* 400: Warning exclamation sensor inside "0" */
                  <g transform={`translate(${offset.dx}, ${offset.dy})`}>
                    <circle
                      cx="128"
                      cy="70"
                      r="11.5"
                      fill="#1a160c"
                      stroke="#f59e0b"
                      strokeWidth="1.1"
                      strokeOpacity="0.5"
                    />
                    <rect
                      x="126.2"
                      y="59"
                      width="3.6"
                      height="13.5"
                      rx="1.8"
                      fill="#fbbf24"
                    />
                    <circle cx="128" cy="78" r="2.2" fill="#fbbf24" />
                  </g>
                )}
              </g>

              {/* Corner Security Bolts */}
              <circle id={boltId} fill="#4b5563" cx="112" cy="48" r="2.2" />
              <use href={`#${boltId}`} x="32" />
              <use href={`#${boltId}`} x="32" y="44" />
              <use href={`#${boltId}`} y="44" />
            </>
          )}
        </g>
      </svg>
    </div>
  );
}

