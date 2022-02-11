export default function IntermediateNode({ item, onClick }) {
  const [x, y] =
    item.y === 0
      ? [0, 0]
      : [Math.cos(item.x) * item.r, Math.sin(item.x) * item.r];
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      <circle cx={x} cy={y} r={10} />
    </g>
  );
}
