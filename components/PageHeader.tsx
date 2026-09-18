export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-charcoal-100">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-charcoal-300">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
