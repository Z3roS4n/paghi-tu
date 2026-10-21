export function ProsePage({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
      {intro ? <p className="mt-4 text-lg leading-relaxed text-ink-soft">{intro}</p> : null}
      <div className="mt-10 space-y-6 leading-relaxed [&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_li]:mt-2 [&_p]:text-ink-soft [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-ink-soft [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-ink-soft [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </article>
  );
}
