function scoreColor(score: number) {
  if (score >= 80) return 'var(--wb-pass)';
  if (score >= 50) return 'var(--wb-warning)';
  return 'var(--wb-critical)';
}

export function ScoreBar({
  score,
  height = 4,
  showLabel = false,
}: {
  score: number;
  height?: number;
  showLabel?: boolean;
}) {
  const color = scoreColor(score);
  return (
    <div className="flex items-center gap-2 w-full">
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height, background: 'var(--wb-dim)' }}
      >
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            background: color,
            borderRadius: 'inherit',
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      {showLabel && (
        <span
          className="text-xs font-mono font-semibold shrink-0"
          style={{ color, minWidth: 28, textAlign: 'right' }}
        >
          {score}
        </span>
      )}
    </div>
  );
}

export function ScoreNumber({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color = scoreColor(score);
  const fontSize = size === 'lg' ? 48 : size === 'md' ? 28 : 18;
  return (
    <span
      className="font-bold font-mono tabular-nums leading-none"
      style={{ color, fontSize }}
    >
      {score}
    </span>
  );
}

export function scoreLabel(score: number) {
  if (score >= 80) return 'Good';
  if (score >= 50) return 'Needs work';
  return 'Poor';
}
