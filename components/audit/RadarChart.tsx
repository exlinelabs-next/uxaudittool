/**
 * SVG radar chart showing scores across all 6 audit categories.
 * Purely decorative - all data is in the table below.
 */

const CATEGORIES = [
  { key: 'seo',           label: 'SEO'           },
  { key: 'performance',   label: 'Performance'   },
  { key: 'mobile',        label: 'Mobile'        },
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'ux',            label: 'UX'            },
  { key: 'trust',         label: 'Trust'         },
];

const CX = 110;
const CY = 110;
const MAX_R = 80;
const RINGS = [25, 50, 75, 100];

function polar(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function ringPoints(r: number) {
  return CATEGORIES.map((_, i) => polar((360 / CATEGORIES.length) * i, r));
}

function polyPath(pts: { x: number; y: number }[]) {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
}

function scoreColor(score: number) {
  if (score >= 80) return 'var(--wb-pass)';
  if (score >= 50) return 'var(--wb-warning)';
  return 'var(--wb-critical)';
}

interface Props {
  scores: Partial<Record<string, number>>;
}

export function RadarChart({ scores }: Props) {
  const values = CATEGORIES.map(c => scores[c.key] ?? 0);
  const dataPoints = CATEGORIES.map((c, i) => {
    const r = (values[i] / 100) * MAX_R;
    return polar((360 / CATEGORIES.length) * i, r);
  });

  const avgScore = values.filter(Boolean).length
    ? Math.round(values.filter(Boolean).reduce((a, b) => a + b, 0) / values.filter(Boolean).length)
    : 0;

  return (
    <svg viewBox="0 0 220 220" width="220" height="220" aria-hidden="true">
      {/* Ring grid lines */}
      {RINGS.map(pct => {
        const r = (pct / 100) * MAX_R;
        return (
          <polygon
            key={pct}
            points={ringPoints(r).map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="var(--wb-border)"
            strokeWidth="0.8"
          />
        );
      })}

      {/* Axis lines from centre to each vertex */}
      {CATEGORIES.map((_, i) => {
        const pt = polar((360 / CATEGORIES.length) * i, MAX_R);
        return (
          <line
            key={i}
            x1={CX} y1={CY}
            x2={pt.x} y2={pt.y}
            stroke="var(--wb-border)"
            strokeWidth="0.8"
          />
        );
      })}

      {/* Data polygon fill */}
      <path
        d={polyPath(dataPoints)}
        fill="var(--wb-accent)"
        fillOpacity="0.08"
        stroke="var(--wb-accent-ink)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {dataPoints.map((pt, i) => (
        <circle
          key={i}
          cx={pt.x} cy={pt.y} r={3}
          fill={scoreColor(values[i])}
          stroke="var(--wb-bg)"
          strokeWidth="1"
        />
      ))}

      {/* Category labels */}
      {CATEGORIES.map((c, i) => {
        const angle = (360 / CATEGORIES.length) * i;
        const labelR = MAX_R + 20;
        const pt = polar(angle, labelR);
        const textAnchor =
          Math.abs(pt.x - CX) < 5 ? 'middle' : pt.x < CX ? 'end' : 'start';
        return (
          <text
            key={c.key}
            x={pt.x} y={pt.y + 4}
            textAnchor={textAnchor}
            fontSize="9"
            fill="var(--wb-muted)"
            fontFamily="inherit"
          >
            {c.label}
          </text>
        );
      })}

      {/* Centre score */}
      <text
        x={CX} y={CY - 4}
        textAnchor="middle"
        fontSize="18"
        fontWeight="700"
        fill="var(--wb-text)"
        fontFamily="inherit"
      >
        {avgScore}
      </text>
      <text
        x={CX} y={CY + 11}
        textAnchor="middle"
        fontSize="8"
        fill="var(--wb-muted)"
        fontFamily="inherit"
      >
        avg
      </text>
    </svg>
  );
}
