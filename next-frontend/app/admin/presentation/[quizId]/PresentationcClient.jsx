"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

export default function PresentationClient({ quizId }) {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    socket.emit("join_presentation", { quizId });
    socket.on("update_leaderboard", ({ top }) => setLeaderboard(top));
    return () => socket.off("update_leaderboard");
  }, [quizId]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-6">🏆 Live Leaderboard</h1>
      <div className="w-full max-w-md bg-gray-800 rounded-lg p-4">
        {leaderboard.map((p, i) => (
          <div key={i} className="flex justify-between border-b py-2 text-lg">
            <span>
              {i + 1}. {p.name}
            </span>
            <span>{p.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
