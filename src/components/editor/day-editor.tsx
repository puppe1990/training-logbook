"use client";

type DayEditorProps = {
  day: {
    id: string;
    name: string;
    weekday: number;
  };
};

export function DayEditor({ day }: DayEditorProps) {
  return (
    <section className="space-y-3 rounded-lg border border-zinc-800 p-4">
      <input defaultValue={day.name} aria-label="Day name" />
      <select defaultValue={String(day.weekday)} aria-label="Weekday">
        <option value="0">Sunday</option>
        <option value="1">Monday</option>
        <option value="3">Wednesday</option>
        <option value="4">Thursday</option>
      </select>
    </section>
  );
}
