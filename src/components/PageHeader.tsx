export default function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-8">
      <h1 className="text-2xl font-black text-gold sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{description}</p>}
    </header>
  );
}
