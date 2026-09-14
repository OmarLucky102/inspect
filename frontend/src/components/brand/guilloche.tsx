import { useMemo, type SVGAttributes } from "react";

export interface GuillocheProps extends SVGAttributes<SVGSVGElement> {
  size?: number;
  layers?: number;
  linesPerLayer?: number;
  lobes?: number;
  amplitude?: number;
  className?: string;
}

/**
 * GuillocheRosette — a generative engraving-style rosette in the manner of
 * classic banknote security patterns. Each pass is a sine-modulated ring;
 * many passes at rotated phases interlace into an unbroken web of lines.
 */
export function GuillocheRosette({
  size = 320,
  layers = 7,
  linesPerLayer = 40,
  lobes = 12,
  amplitude = 0.055,
  className,
  ...props
}: GuillocheProps) {
  const paths = useMemo(() => {
    const cx = 100;
    const cy = 100;
    const inner = 24;
    const outer = 95;
    const out: string[] = [];

    for (let l = 0; l < layers; l++) {
      const baseR = inner + ((outer - inner) * l) / (layers - 1);
      const amp = baseR * amplitude;
      const count = linesPerLayer + l * 2;
      const steps = 240;

      for (let k = 0; k < count; k++) {
        const phase = (k / count) * Math.PI * 2;
        let d = "";
        for (let s = 0; s <= steps; s++) {
          const theta = (s / steps) * Math.PI * 2;
          const r = baseR + amp * Math.sin(lobes * theta + phase);
          const x = (cx + r * Math.cos(theta)).toFixed(2);
          const y = (cy + r * Math.sin(theta)).toFixed(2);
          d += s === 0 ? `M${x} ${y}` : `L${x} ${y}`;
        }
        out.push(d);
      }
    }
    return out;
  }, [layers, linesPerLayer, lobes, amplitude]);

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={0.55}
      aria-hidden="true"
      className={className}
      {...props}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}