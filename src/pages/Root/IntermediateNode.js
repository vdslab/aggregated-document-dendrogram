export default function IntermediateNode({ item, onClick }) {
  const [x, y] =
    item.r === 0
      ? [0, 0]
      : [Math.cos(item.t) * item.r, Math.sin(item.t) * item.r];
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      <circle cx={x} cy={y} r="6" fill="#888" />
    </g>
  );
}
