import { useEffect, useId, useRef, useState } from 'react';

export interface RobotForbidden403Props {
  className?: string;
  compact?: boolean;
}

/**
 * RobotForbidden403
 * Interactive 403 Forbidden robot graphic based on the original SVG design:
 * - "Bungee" typography where "0" forms the robot's head and eye socket at (130, 65)
 * - Animated flashing red security beacon on top
 * - Interactive eye that tracks mouse and touch movements across the screen
 * - Authentic metallic dark palette (#2b2b2b) with glowing cyan camera lens (#2aa7cc)
 */
export function RobotForbidden403({
  className = '',
  compact = false,
}: RobotForbidden403Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Default position is center: cx = 130, cy = 65
  const [eyePos, setEyePos] = useState({ cx: 130, cy: 65 });

  useEffect(() => {
    let ticking = false;

    const handlePointer = (clientX: number, clientY: number) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const winW = window.innerWidth || 1;
        const winH = window.innerHeight || 1;
        // Normalized cursor coordinate [0..1]
        const x = Math.max(0, Math.min(1, clientX / winW));
        const y = Math.max(0, Math.min(1, clientY / winH));

        // Original formula: cx = 115 + 30 * x, cy = 50 + 30 * y
        setEyePos({
          cx: 115 + 30 * x,
          cy: 50 + 30 * y,
        });
        ticking = false;
      });
    };

    const onMouseMove = (e: MouseEvent) => handlePointer(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        handlePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  const uid = useId().replace(/:/g, '');
  const clipId = `robot-white-clip-${uid}`;
  const textId = `robot-text-s-${uid}`;
  const screwId = `robot-tornillo-${uid}`;

  return (
    <div
      ref={containerRef}
      dir="ltr"
      className={`relative flex items-center justify-center select-none ${
        compact ? '' : 'w-full'
      } ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 260 118.9"
        role="img"
        aria-label="403 Forbidden Robot"
        style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}
        className={`robot-forbidden-svg ${
          compact
            ? 'h-24 sm:h-28 w-auto aspect-[260/118.9]'
            : 'w-[280px] sm:w-[400px] md:w-[460px] max-w-full h-auto aspect-[260/118.9]'
        } drop-shadow-xl transition-transform duration-300 hover:scale-[1.02]`}
      >
        <title>403 Error</title>

        <defs>
          <style>{`
            .robot-bungee {
              font-family: 'Bungee', cursive, sans-serif;
              font-weight: 400;
              font-style: normal;
              font-size: 120px;
              direction: ltr;
              unicode-bidi: bidi-override;
              text-anchor: start;
            }
            @keyframes robotAlarmOn {
              to {
                fill: darkred;
              }
            }
            .robot-alarm {
              animation: robotAlarmOn 0.5s infinite;
            }
          `}</style>

          {/* Eye socket clipping mask - centered inside the '0' at (130, 65) */}
          <clipPath id={clipId}>
            <circle cx="130" cy="65" r="20" />
          </clipPath>

          {/*
            403 text in Bungee font (120px).
            In Bungee metrics (UPM 1000, scale 0.12), "4" + "0" middle puts
            the '0' center at 128.7px, so x="1.3" aligns '0' dead-center at x = 130.
          */}
          <text
            id={textId}
            className="robot-bungee"
            x="1.3"
            y="106"
            textAnchor="start"
            style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}
          >
            403
          </text>
        </defs>

        {/* Flashing top alarm beacon */}
        <path
          className="robot-alarm"
          fill="#e62326"
          d="M120.9 19.6V9.1c0-5 4.1-9.1 9.1-9.1h0c5 0 9.1 4.1 9.1 9.1v10.6"
        />

        {/* 403 Text Shadow */}
        <use
          href={`#${textId}`}
          x="-0.5"
          y="-1"
          fill="#000000"
          style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}
        />
        {/* 403 Main Text Body */}
        <use
          href={`#${textId}`}
          fill="#2b2b2b"
          style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}
        />

        {/* Robot Head Elements */}
        <g id="robot-features">
          <g id="eye-wrap">
            {/* White eye socket backing */}
            <circle fill="#cacaca" cx="130" cy="65" r="20" />

            {/* Interactive moving eye pupil, clipped to eye socket */}
            <circle
              id="eyef"
              clipPath={`url(#${clipId})`}
              cx={eyePos.cx}
              cy={eyePos.cy}
              r="11"
              fill="#000000"
              stroke="#2aa7cc"
              strokeWidth="2"
              strokeMiterlimit="10"
            />

            {/* Eyelid / Upper Visor brow */}
            <ellipse fill="#2b2b2b" cx="130" cy="40" rx="18" ry="12" />
          </g>

          {/* Corner Screws / Bolts */}
          <circle id={screwId} fill="#444444" cx="105" cy="32" r="2.5" />
          <use href={`#${screwId}`} x="50" />
          <use href={`#${screwId}`} x="50" y="60" />
          <use href={`#${screwId}`} y="60" />
        </g>
      </svg>
    </div>
  );
}
