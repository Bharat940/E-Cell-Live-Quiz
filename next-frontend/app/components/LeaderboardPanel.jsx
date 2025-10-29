export default function LeaderboardPanel({ leaderboard }) {
  if (!leaderboard?.length) return null;

  return (
    <div className="bg-gray-800 rounded-lg mt-6 p-4 w-full max-w-md shadow">
      <h2 className="text-xl font-bold mb-3 text-center">
        🏆 Live Leaderboard
      </h2>
      {leaderboard.map((p, i) => (
        <div
          key={i}
          className="flex justify-between py-2 border-b border-gray-700 text-gray-200"
        >
          <span>
            {i + 1}. {p.name}
          </span>
          <span>{p.score}</span>
        </div>
      ))}
    </div>
  );
}
