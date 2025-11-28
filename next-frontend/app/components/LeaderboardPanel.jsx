export default function LeaderboardPanel({ leaderboard }) {
  if (!leaderboard?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg">👥 No participants yet</p>
        <p className="text-sm mt-2">Waiting for participants to join...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {leaderboard.map((p, i) => {
        // Medal emojis for top 3
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";
        
        return (
          <div
            key={i}
            className={`flex justify-between items-center p-4 rounded-xl transition-all ${
              i === 0
                ? "bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 border border-yellow-500/50"
                : i === 1
                ? "bg-gradient-to-r from-gray-400/20 to-gray-300/20 border border-gray-400/50"
                : i === 2
                ? "bg-gradient-to-r from-orange-600/20 to-orange-500/20 border border-orange-500/50"
                : "bg-gray-800/50 border border-gray-700"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-bold ${
                i < 3 ? "text-cyan-400" : "text-gray-500"
              }`}>
                {medal || `#${i + 1}`}
              </span>
              <span className={`font-semibold ${
                i < 3 ? "text-white text-lg" : "text-gray-300"
              }`}>
                {p.name}
              </span>
            </div>
            <span className={`text-xl font-bold tabular-nums ${
              i < 3 ? "text-cyan-400" : "text-gray-400"
            }`}>
              {p.score}
            </span>
          </div>
        );
      })}
    </div>
  );
}
