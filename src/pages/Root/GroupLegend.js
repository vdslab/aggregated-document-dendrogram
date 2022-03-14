export default function GroupLegend({ groups }) {
  const itemHeight = 20;
  return (
    <>
      {groups.map((group, i) => {
        return (
          <g
            key={group.group}
            transform={`translate(0,${itemHeight * i + itemHeight / 2})`}
          >
            <rect
              y={-(itemHeight - 4) / 2}
              width={itemHeight - 4}
              height={itemHeight - 4}
              fill={group.color}
            />
            <text
              x={itemHeight}
              fontSize="10"
              fontWeight="bold"
              dominantBaseline="central"
            >
              {group.group}
            </text>
          </g>
        );
      })}
    </>
  );
}
