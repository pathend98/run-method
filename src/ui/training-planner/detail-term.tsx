type DetailTermProps = {
  label: string;
  value: string;
};

export function DetailTerm({ label, value }: DetailTermProps) {
  return (
    <div className="col-span-2 sm:col-span-1">
      <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-zinc-950">{value}</dd>
    </div>
  );
}
