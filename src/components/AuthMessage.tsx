export default function AuthMessage({
  type,
  children,
}: {
  type: 'error' | 'success' | 'info';
  children: React.ReactNode;
}) {
  const styles = {
    error: 'border-red-500/60 text-red-400',
    success: 'border-neon/60 text-neon',
    info: 'border-border text-muted',
  } as const;
  return (
    <p role={type === 'error' ? 'alert' : 'status'} className={`rounded-lg border p-3 text-sm ${styles[type]}`}>
      {children}
    </p>
  );
}
