import { Select } from "@/components/ui/input";
import { WHEN_PLACED_OPTIONS, type WhenPlaced } from "@/types/database";

const LABELS: Record<WhenPlaced, string> = {
  pregame: "Pregame",
  live_1h: "Live — 1st Half",
  halftime: "Halftime",
  live_2h: "Live — 2nd Half",
  live: "Live",
};

export function WhenPlacedSelect({
  value,
  onChange,
  id,
}: {
  value: WhenPlaced;
  onChange: (v: WhenPlaced) => void;
  id?: string;
}) {
  return (
    <Select id={id} value={value} onChange={(e) => onChange(e.target.value as WhenPlaced)}>
      {WHEN_PLACED_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {LABELS[opt]}
        </option>
      ))}
    </Select>
  );
}
