export function ProsePage({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 pt-8 pb-12 md:px-7 md:pt-14">
      <h1 className="text-[clamp(2.1rem,8vw,3.4rem)] leading-[1.04] font-extrabold">{title}</h1>
      {intro ? <p className="mt-4 text-lg leading-relaxed text-ink-soft">{intro}</p> : null}
      <div className="mt-10 space-y-5 text-[17px] leading-relaxed [&_a]:font-semibold [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mt-12 [&_h2]:text-[1.7rem] [&_h2]:leading-tight [&_h2]:font-extrabold [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-bold [&_li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-ink-soft [&_p]:text-ink-soft [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-ink-soft">
        {children}
      </div>
    </article>
  );
}
