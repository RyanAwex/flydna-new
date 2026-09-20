import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-top pt-40 h-screen bg-[var(--bg-app)]">
      <h2 className="text-4xl font-bold mb-4">Not Found</h2>
      <p className="text-lg mb-6">Could not find requested resource</p>
      <Link href="/travel" className="text-blue-500 hover:underline">
        Return Home
      </Link>
    </div>
  );
}
