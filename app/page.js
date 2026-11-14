
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow-lg text-center">
        <h1 className="text-4xl font-bold text-gray-800">
          My Todo App
        </h1>

        <p className="mt-3 text-gray-500">
          Organize your tasks and manage your day.
        </p>

        <Link
          href="/dashboard"
          className="inline-block mt-6 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
