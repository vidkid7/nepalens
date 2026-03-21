import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center px-4">
        <p className="text-hero text-brand font-bold mb-2">404</p>
        <h1 className="text-display text-surface-900 mb-3">Page not found</h1>
        <p className="text-body text-surface-500 max-w-md mx-auto mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            Go Home
          </Link>
          <Link href="/search" className="btn btn-ghost">
            Search
          </Link>
        </div>
      </div>
    </div>
  );
}
