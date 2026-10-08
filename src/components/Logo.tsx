/** "sonare." — o ponto final é o símbolo: a singularidade de onde nasce a criação. */
export function Logo({ pulsando = false }: { pulsando?: boolean }) {
  return (
    <span className="inline-flex items-baseline font-logo text-4xl font-light tracking-[0.35em] sm:text-5xl">
      sonare
      <span className="relative ml-[-0.25em] inline-block size-[0.22em] translate-y-[-0.05em] rounded-full bg-grafite">
        {pulsando &&
          [0, 0.8, 1.6].map((atraso) => (
            <span
              key={atraso}
              aria-hidden
              className="onda absolute inset-0 rounded-full border border-nevoa"
              style={{ animationDelay: `${atraso}s` }}
            />
          ))}
      </span>
    </span>
  );
}
