import { TILE_ATTRIBUTION } from "@/lib/map-style";

function SourceLink({ label, url }: { label: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
      {label}
    </a>
  );
}

export function MapAttribution({ className }: { className?: string }) {
  const [tiles, vectors, data] = TILE_ATTRIBUTION;

  return (
    <p
      data-testid="map-attribution"
      className={`text-muted text-xs ${className ?? ""}`}
    >
      Base map <SourceLink {...tiles} />, © <SourceLink {...vectors} />. Map data
      © <SourceLink {...data} /> contributors.
    </p>
  );
}
