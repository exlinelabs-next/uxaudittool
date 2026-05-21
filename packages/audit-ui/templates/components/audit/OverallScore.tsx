const R = 54;
const CIRCUMFERENCE = 2 * Math.PI * R; // 339.3

function scoreColor(score: number) {
  if (score >= 80) return 'var(--wb-pass)';
  if (score >= 50) return 'var(--wb-warn)';
  return 'var(--wb-fail)';
}

function scoreLabel(score: number) {
  if (score >= 80) return 'Good';
  if (score >= 50) return 'Needs work';
  return 'Poor';
}

export function OverallScore({ score }: { score: number }) {
  const color = scoreColor(score);
  const dash = (score / 100) * CIRCUMFERENCE;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="140" height="140" viewBox="0 0 120 120" aria-label={`Overall score: ${score} out of 100`}>
        {/* Track */}
        <circle cx="60" cy="60" r={R} fill="none" stroke="var(--wb-border)" strokeWidth="8" />
        {/* Progress */}
        <circle
          cx="60" cy="60" r={R}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        {/* Score number */}
        <text x="60" y="57" textAnchor="middle" fill="var(--wb-text)" fontSize="26" fontWeight="700" fontFamily="inherit">
          {score}
        </text>
        {/* /100 */}
        <text x="60" y="73" textAnchor="middle" fill="var(--wb-muted)" fontSize="11" fontFamily="inherit">
          / 100
        </text>
      </svg>

      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color }}>
          {scoreLabel(score)}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--wb-muted)' }}>
          Overall score
        </p>
      </div>
    </div>
  );
}
