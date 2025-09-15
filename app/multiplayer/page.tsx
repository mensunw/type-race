import Link from "next/link";

export default function MultiplayerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-md w-full text-center">
        <div className="mb-8">
          <div className="text-6xl mb-4">🚧</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Coming Soon!</h1>
          <p className="text-gray-600">
            Multiplayer racing is currently under development. Stay tuned for real-time races against other players!
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-gray-800 mb-2">Planned Features:</h2>
          <ul className="text-sm text-gray-600 space-y-1 text-left">
            <li>• Real-time multiplayer races</li>
            <li>• Lobby system</li>
            <li>• Global leaderboards</li>
            <li>• Custom race rooms</li>
            <li>• Spectator mode</li>
          </ul>
        </div>

        <Link
          href="/"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 block"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}