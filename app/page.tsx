import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🏎️ TypeRace</h1>
          <p className="text-gray-600">
            Test your typing speed in an exciting racing game!
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/single"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 block"
          >
            🎮 Single Player (vs Bot)
          </Link>

          <Link
            href="/multiplayer"
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-lg transition-colors duration-200 block"
          >
            👥 Multiplayer
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Race against time and opponents!</p>
        </div>
      </div>
    </div>
  );
}
