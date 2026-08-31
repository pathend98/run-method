type ReadOnlyDetailProps = {
  label: string;
  value: string;
};

export function ReadOnlyDetail({ label, value }: ReadOnlyDetailProps) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 text-zinc-950">{value}</dd>
    </div>
  );
}
