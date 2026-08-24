import type { ReviewScores } from '../types';

interface RadarChartProps {
  scores: ReviewScores;
  size?: number;
}

const DIMENSIONS: { key: keyof ReviewScores; label: string }[] = [
  { key: 'logic', label: '逻辑严谨' },
  { key: 'persuasion', label: '说服力' },
  { key: 'fluency', label: '流利度' },
  { key: 'aura', label: '气场决断' },
  { key: 'clarity', label: '观点清晰' },
];

export function RadarChart({ scores, size = 280 }: RadarChartProps) {
  const center = size / 2;
  const radius = size / 2 - 44;
  const levels = 5; // 0,2,4,6,8,10 五圈
  const angleStep = (Math.PI * 2) / DIMENSIONS.length;

  // 某维度某分值对应的坐标
  function point(dimIndex: number, value: number) {
    const angle = -Math.PI / 2 + dimIndex * angleStep;
    const r = (value / 10) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  }

  // 网格多边形
  const gridPolygons = Array.from({ length: levels }, (_, i) => {
    const value = ((i + 1) / levels) * 10;
    return DIMENSIONS.map((_, di) => point(di, value));
  });

  // 数据多边形
  const dataPoints = DIMENSIONS.map((dim, i) => point(i, scores[dim.key]));
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', margin: '0 auto' }}
    >
      {/* 网格 */}
      {gridPolygons.map((poly, i) => (
        <polygon
          key={i}
          points={poly.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={1}
        />
      ))}

      {/* 轴线 */}
      {DIMENSIONS.map((_, i) => {
        const p = point(i, 10);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="#e2e8f0"
            strokeWidth={1}
          />
        );
      })}

      {/* 数据区域 */}
      <polygon
        points={dataPath}
        fill="rgba(11, 61, 145, 0.2)"
        stroke="#1565c0"
        strokeWidth={2}
      />

      {/* 数据点 */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#1565c0" />
      ))}

      {/* 标签 */}
      {DIMENSIONS.map((dim, i) => {
        const p = point(i, 12.5);
        return (
          <g key={dim.key}>
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={12}
              fontWeight={600}
              fill="#1e293b"
            >
              {dim.label}
            </text>
            <text
              x={p.x}
              y={p.y + 16}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fill="#1565c0"
              fontWeight={700}
            >
              {scores[dim.key]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
