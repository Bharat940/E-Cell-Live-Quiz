"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { socket } from "@/lib/socket";
import LeaderboardPanel from "@/app/components/LeaderboardPanel";

export default function AdminQuizControlClient({ quizId }) {
  const [adminKey, setAdminKey] = useState("");
  const [showQR, setShowQR] = useState(true);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  useEffect(() => {
    const key = localStorage.getItem("adminKey");
    if (key) setAdminKey(key);
  }, []);

  const handleStartQuiz = () =>
    socket.emit("admin_start_quiz", { quizId, adminKey });
  const handleNextQuestion = () =>
    socket.emit("admin_next_question", { quizId, adminKey });
  const handleToggleLeaderboard = (on) => {
    socket.emit("admin_toggle_leaderboard", { quizId, adminKey, on });
    setLeaderboardVisible(on);
  };

  useEffect(() => {
    socket.emit("join_admin", { quizId });
    socket.on("current_question", ({ question }) =>
      setCurrentQuestion(question)
    );
    socket.on("update_leaderboard", ({ top }) => setLeaderboard(top));
    return () => {
      socket.off("current_question");
      socket.off("update_leaderboard");
    };
  }, [quizId]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center space-y-6">
      <h1 className="text-3xl font-bold">Admin Quiz Control</h1>

      {/* --- Toggle QR --- */}
      <button
        onClick={() => setShowQR(!showQR)}
        className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
      >
        {showQR ? "Hide QR Code" : "Show QR Code"}
      </button>

      {showQR && typeof window !== "undefined" && (
        <div className="flex flex-col items-center space-y-2">
          <QRCode
            value={`${window.location.origin}/quiz/${quizId}`}
            size={180}
          />
          <p className="text-gray-400 text-sm">Participants can scan to join</p>
        </div>
      )}

      {/* --- Current Question --- */}
      {currentQuestion ? (
        <div className="bg-gray-800 p-4 rounded-lg max-w-xl text-center">
          <h3 className="text-xl font-semibold mb-2">Current Question</h3>
          <p className="text-lg">{currentQuestion.questionText}</p>
        </div>
      ) : (
        <p className="text-gray-400">No question active yet.</p>
      )}

      {/* --- Controls --- */}
      <div className="flex gap-4 mt-4">
        <button
          onClick={handleStartQuiz}
          className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded"
        >
          Start Quiz
        </button>
        <button
          onClick={handleNextQuestion}
          className="bg-yellow-600 hover:bg-yellow-700 px-5 py-2 rounded"
        >
          Next Question
        </button>
        <button
          onClick={() => handleToggleLeaderboard(!leaderboardVisible)}
          className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded"
        >
          {leaderboardVisible ? "Hide Leaderboard" : "Show Leaderboard"}
        </button>
      </div>

      {/* --- Optional embedded leaderboard --- */}
      {leaderboardVisible && <LeaderboardPanel leaderboard={leaderboard} />}
    </div>
  );
}
