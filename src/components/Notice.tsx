// Used for "not configured" and empty states. Never shows placeholder financial data.
export default function Notice({
  title,
  children,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center">
      <p className="font-bold">{title}</p>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
