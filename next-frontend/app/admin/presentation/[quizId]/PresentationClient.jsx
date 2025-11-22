"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

export default function PresentationClient({ quizId }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [visible, setVisible] = useState(false);
  const [quizLive, setQuizLive] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`/api/leaderboard?quizId=${quizId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setLeaderboard(data.data);
      }
    } catch (err) {
      console.error("Leaderboard fetch failed:", err.message);
    }
  };

  useEffect(() => {
    // Join the new presentation room
    socket.emit("join_presentation", { quizId });

    // Receive real-time leaderboard updates
    socket.on("update_leaderboard", ({ top }) => setLeaderboard(top || []));
    socket.on("leaderboard_visibility", ({ on }) => setVisible(on));

    // Set quiz status live / end
    socket.on("quiz_start", () => {
      setQuizLive(true);
      fetchLeaderboard();
    });

    socket.on("quiz_end", () => {
      setQuizLive(false);
      fetchLeaderboard();
    });

    // Fetch leaderboard periodically when visible
    const interval = setInterval(() => {
      if (visible) fetchLeaderboard();
    }, 5000);

    return () => {
      socket.off("update_leaderboard");
      socket.off("leaderboard_visibility");
      socket.off("quiz_start");
      socket.off("quiz_end");
      clearInterval(interval);
    };
  }, [quizId, visible]);

  // Show proper quiz live indicator
  if (!quizLive && leaderboard.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-gray-300 text-2xl font-semibold">
        <p>⚡ Quiz is not live yet</p>
        <p className="text-gray-500 text-lg mt-2">
          Waiting for quiz to start...
        </p>
      </div>
    );
  }

  if (visible && leaderboard.length === 0 && quizLive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-gray-300 text-2xl font-semibold">
        Waiting for participants 🕒
      </div>
    );
  }

  if (!visible && quizLive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-gray-400 italic text-2xl">
        Leaderboard hidden by admin 👀
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-6">🏆 Live Leaderboard</h1>
      <div className="w-full max-w-md bg-gray-800 rounded-lg p-4 shadow-lg">
        {leaderboard.map((p, i) => (
          <div
            key={i}
            className="flex justify-between border-b border-gray-700 py-2 text-lg"
          >
            <span>
              {i + 1}.{" "}
              <span className="font-semibold text-cyan-400">{p.name}</span>
            </span>
            <span className="text-gray-200">{p.score}</span>
          </div>
        ))}
      </div>

      {!visible && !quizLive && (
        <p className="text-gray-400 italic mt-6">
          Leaderboard will appear when the quiz starts
        </p>
      )}
    </div>
  );
}
