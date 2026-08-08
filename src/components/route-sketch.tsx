import { placeName } from "@/lib/display";
import { projectRoute, routeStops, stageLines } from "@/lib/route";

const WIDTH = 320;
const HEIGHT = 150;
const INSET = 30;
const LONGEST_LABEL_LINE = 14;
const LINE_HEIGHT = 9;

function wrapLabel(name: string): string[] {
  const lines: string[] = [];
  for (const word of placeName(name).split(" ")) {
    const last = lines[lines.length - 1];
    if (last && `${last} ${word}`.length <= LONGEST_LABEL_LINE) {
      lines[lines.length - 1] = `${last} ${word}`;
    } else {
      lines.push(word);
    }
  }
  return lines;
}

function anchorFor(x: number): "start" | "middle" | "end" {
  if (x < WIDTH * 0.2) return "start";
  if (x > WIDTH * 0.8) return "end";
  return "middle";
}

export function RouteSketch({ className }: { className?: string }) {
  const projection = projectRoute(WIDTH, HEIGHT, INSET);
  const lines = stageLines();
  const stops = routeStops();

  return (
    <svg
      data-testid="route-sketch"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="The route from Logroño to Burgos, drawn as five indicative straight-line Stages"
      className={className}
      fill="none"
    >
      {lines.map((line) => (
        <polyline
          key={line.stage.number}
          data-testid={`sketch-stage-${line.stage.number}`}
          points={line.points
            .map((point) => projection.project(point).join(","))
            .join(" ")}
          stroke={line.colour}
          strokeWidth="2.5"
          strokeDasharray="7 5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {stops.map((stop, index) => {
        const [x, y] = projection.project(stop.at);
        const labelLines = wrapLabel(stop.name);
        const above = index % 2 === 0;
        const firstLineY = above
          ? y - 9 - (labelLines.length - 1) * LINE_HEIGHT
          : y + 15;

        return (
          <g key={stop.name}>
            <circle cx={x} cy={y} r="4" fill={stop.colour} />
            <text
              x={x}
              y={firstLineY}
              textAnchor={anchorFor(x)}
              className="fill-ink"
              fontSize="8"
              fontWeight="600"
            >
              {labelLines.map((labelLine, lineIndex) => (
                <tspan
                  key={labelLine}
                  x={x}
                  dy={lineIndex === 0 ? 0 : LINE_HEIGHT}
                >
                  {labelLine}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
