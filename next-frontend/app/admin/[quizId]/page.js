"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { socket } from "@/lib/socket";

export default function AdminQuizControlPage({ params }) {
  const { quizId } = params;
  const [adminKey, setAdminKey] = useState("");
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const storedKey = localStorage.getItem("adminKey");
    if (storedKey) {
      setAdminKey(storedKey);
    }
  }, []);

  const handleStartQuiz = () => {
    socket.emit("admin_start_quiz", { quizId, adminKey });
  };

  const handleNextQuestion = () => {
    socket.emit("admin_next_question", { quizId, adminKey });
  };

  const toggleLeaderboard = (on) => {
    socket.emit("admin_toggle_leaderboard", { quizId, adminKey, on });
    setLeaderboardVisible(on);
  };

  useEffect(() => {
    socket.on("update_leaderboard", ({ top }) => setLeaderboard(top));
    return () => socket.off("update_leaderboard");
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-6">
      <h1 className="text-2xl font-bold">Admin Control Panel</h1>
      <QRCode value={`${window.location.origin}/quiz/${quizId}`} size={180} />
      <p className="text-gray-600">Share this QR for participants to join</p>

      <div className="flex gap-3">
        <button
          onClick={handleStartQuiz}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Start Quiz
        </button>
        <button
          onClick={handleNextQuestion}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Next Question
        </button>
        <button
          onClick={() => toggleLeaderboard(!leaderboardVisible)}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          {leaderboardVisible ? "Hide" : "Show"} Leaderboard
        </button>
      </div>
    </div>
  );
}
