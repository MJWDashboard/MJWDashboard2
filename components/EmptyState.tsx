export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="table-shell flex flex-col items-center justify-center gap-1 bg-charcoal-800/30 py-16 text-center">
      <p className="text-sm font-medium text-charcoal-200">{title}</p>
      {description && <p className="text-sm text-charcoal-400">{description}</p>}
    </div>
  );
}
