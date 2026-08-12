export default function NotFound() {
  return (
    <main className="mow-lines flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-xs uppercase tracking-[0.3em] text-bail">GitWicket</p>
      <h1 className="mt-3 font-display text-3xl uppercase text-chalk">Retired hurt</h1>
      <p className="mt-2 max-w-sm font-body text-sm text-chalk/70">
        That GitHub username doesn&apos;t exist, or the profile is private. Check the spelling and
        try again.
      </p>
      <a href="/" className="mt-6 font-mono text-xs text-bail underline">
        back to the pavilion
      </a>
    </main>
  );
}
