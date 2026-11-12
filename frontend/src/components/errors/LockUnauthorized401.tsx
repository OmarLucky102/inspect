import { useId, useState } from 'react';
import { usePointerParallax } from '@/lib/use-pointer-parallax';

export interface LockUnauthorized401Props {
  className?: string;
  compact?: boolean;
}

/**
 * Interactive 401 Unauthorized vault graphic matching the 403 robot styling:
 * - "Bungee" typography for "4" and "1" flanking a custom padlock "0" vault
 * - Animated security beacon and rotating scanner reticle
 * - Interactive keyhole core with subtle pointer parallax and click shake
 */
export function LockUnauthorized401({
  className = '',
  compact = false,
}: LockUnauthorized401Props) {
  const offset = usePointerParallax(3.2);
  const [isShaking, setIsShaking] = useState(false);

  const triggerLockPulse = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);
  };

  const uid = useId().replace(/:/g, '');
  const fourId = `lock-four-${uid}`;
  const oneId = `lock-one-${uid}`;
  const boltId = `lock-bolt-${uid}`;
  const dialClipId = `lock-dial-clip-${uid}`;

  return (
    <div
      dir="ltr"
      onClick={triggerLockPulse}
      className={`relative flex items-center justify-center select-none ${
        compact ? '' : 'w-full'
      } ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 260 124"
        role="img"
        aria-label="401 Unauthorized Vault"
        style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}
        className={`lock-unauthorized-svg cursor-pointer ${
          compact
            ? 'h-24 sm:h-28 w-auto aspect-[260/124]'
            : 'w-[280px] sm:w-[400px] md:w-[460px] max-w-full h-auto aspect-[260/124]'
        } drop-shadow-xl transition-transform duration-300 hover:scale-[1.02]`}
      >
        <title>401 Unauthorized</title>

        <defs>
          <style>{`
            .lock-bungee {
              font-family: 'Bungee', cursive, sans-serif;
              font-weight: 400;
              font-style: normal;
              font-size: 106px;
              direction: ltr;
              unicode-bidi: bidi-override;
              text-anchor: middle;
            }
            @keyframes lockBeaconPulse {
              0%, 100% {
                fill: #38bdf8;
                opacity: 1;
              }
              50% {
                fill: #0284c7;
                opacity: 0.45;
              }
            }
            @keyframes lockScannerSpin {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }
            @keyframes lockVaultJitter {
              0%, 100% { transform: rotate(0deg); }
              20% { transform: rotate(-4deg); }
              40% { transform: rotate(4deg); }
              60% { transform: rotate(-2.5deg); }
              80% { transform: rotate(2.5deg); }
            }
            .lock-beacon {
              animation: lockBeaconPulse 1.4s ease-in-out infinite;
            }
            .lock-scanner {
              transform-origin: 130px 70px;
              animation: lockScannerSpin 14s linear infinite;
            }
            .lock-jitter {
              transform-origin: 130px 64px;
              animation: lockVaultJitter 0.42s ease-in-out;
            }
          `}</style>

          <clipPath id={dialClipId}>
            <ellipse cx="130" cy="70" rx="18" ry="26" />
          </clipPath>

          <text
            id={fourId}
            className="lock-bungee"
            x="55"
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
            id={oneId}
            className="lock-bungee"
            x="198"
            y="106"
            textAnchor="middle"
            style={{
              direction: 'ltr',
              unicodeBidi: 'bidi-override',
              textAnchor: 'middle',
            }}
          >
            1
          </text>
        </defs>

        {/* Left & Right "4" and "1" with deep shadow + crisp rim */}
        <use
          href={`#${fourId}`}
          x="-0.8"
          y="-1"
          fill="#000000"
          style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}
        />
        <use
          href={`#${fourId}`}
          fill="#2b2b2b"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="0.7"
          style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}
        />

        <use
          href={`#${oneId}`}
          x="-0.8"
          y="-1"
          fill="#000000"
          style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}
        />
        <use
          href={`#${oneId}`}
          fill="#2b2b2b"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="0.7"
          style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}
        />

        {/* Center "0" Security Padlock Vault */}
        <g className={isShaking ? 'lock-jitter' : undefined}>
          {/* Steel Padlock Shackle */}
          <path
            d="M 114 40 V 25 a 16 16 0 0 1 32 0 V 40"
            fill="none"
            stroke="#000000"
            strokeWidth="9.5"
            strokeLinecap="round"
            transform="translate(-0.6, -0.8)"
          />
          <path
            d="M 114 40 V 25 a 16 16 0 0 1 32 0 V 40"
            fill="none"
            stroke="#2b2b2b"
            strokeWidth="8.5"
            strokeLinecap="round"
          />
          <path
            d="M 114 40 V 25 a 16 16 0 0 1 32 0 V 40"
            fill="none"
            stroke="#2aa7cc"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.85"
          />

          {/* Top Status LED Beacon */}
          <rect
            x="124"
            y="4"
            width="12"
            height="5"
            rx="2.5"
            fill="#1f2937"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="0.6"
          />
          <circle className="lock-beacon" cx="130" cy="6.5" r="2.2" />

          {/* Vault "0" Shadow & Metallic Frame */}
          <ellipse
            cx="129.2"
            cy="69"
            rx="23"
            ry="31"
            fill="#000000"
            stroke="#000000"
            strokeWidth="12"
          />
          <ellipse
            cx="130"
            cy="70"
            rx="23"
            ry="31"
            fill="#171b23"
            stroke="#2b2b2b"
            strokeWidth="12"
          />
          <ellipse
            cx="130"
            cy="70"
            rx="29"
            ry="37"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="0.8"
          />

          {/* Inner Security Scanner Ring (clipped inside vault opening) */}
          <g clipPath={`url(#${dialClipId})`}>
            <circle
              className="lock-scanner"
              cx="130"
              cy="70"
              r="15.5"
              fill="none"
              stroke="#2aa7cc"
              strokeWidth="1.6"
              strokeDasharray="6 4"
              strokeOpacity="0.8"
            />
            <circle
              cx="130"
              cy="70"
              r="11.5"
              fill="#0b1220"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeOpacity="0.45"
            />

            {/* Interactive Keyhole Core */}
            <g transform={`translate(${offset.dx}, ${offset.dy})`}>
              <circle
                cx="130"
                cy="66.5"
                r="6.2"
                fill="#0284c7"
                fillOpacity="0.22"
              />
              <path
                d="M 130 61 a 5.2 5.2 0 1 0 0 10.4 a 5.2 5.2 0 0 0 0 -10.4 Z M 127.6 69.5 L 126.2 81.5 h 7.6 l -1.4 -12 Z"
                fill="#e2e8f0"
                stroke="#2aa7cc"
                strokeWidth="1.1"
                strokeLinejoin="round"
              />
              <circle cx="128.4" cy="64.5" r="1.2" fill="#38bdf8" />
            </g>
          </g>

          {/* Corner Security Bolts */}
          <circle id={boltId} fill="#4b5563" cx="114" cy="48" r="2.2" />
          <use href={`#${boltId}`} x="32" />
          <use href={`#${boltId}`} x="32" y="44" />
          <use href={`#${boltId}`} y="44" />
        </g>
      </svg>
    </div>
  );
}

