export function TopBar() {
  return (
    <div className="bg-ink px-6 py-2 text-xs text-fog-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <span>
          Email:{' '}
          <a href="mailto:hello@theknittedcloudcompany.com" className="underline">
            hello@theknittedcloudcompany.com
          </a>
        </span>
        <div className="flex gap-3">
          {['X', 'FB', 'IG', 'PIN'].map((label) => (
            <span key={label} className="opacity-80">
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
