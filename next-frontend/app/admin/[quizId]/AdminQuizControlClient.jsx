"use client";

import { useEffect, useState, useRef } from "react";
import QRCode from "react-qr-code";
import { socket } from "@/lib/socket";
import LeaderboardPanel from "@/app/components/LeaderboardPanel";

export default function AdminQuizControlClient({ quizId }) {
  const [adminKey, setAdminKey] = useState("");
  const [showQR, setShowQR] = useState(true);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [quizLive, setQuizLive] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const key = localStorage.getItem("adminKey");
    if (key) setAdminKey(key);

    // Join the admin room to receive real-time updates
    socket.emit("join_admin", { quizId });

    // Request current question if quiz already active
    socket.emit("get_current_question", { quizId });

    // When quiz starts
    socket.on("quiz_start", () => {
      setQuizLive(true);
      socket.emit("admin_next_question", { quizId, adminKey });
    });

    // When quiz ends
    socket.on("quiz_end", () => {
      setQuizLive(false);
      setCurrentQuestion(null);
      clearInterval(timerRef.current);
      setTimer(0);
    });

    // When a new question appears
    socket.on("new_question", (q) => {
      setCurrentQuestion(q);
      setTimer(q.timeLimit || 30);

      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    });

    socket.on("update_leaderboard", ({ top }) => setLeaderboard(top || []));
    socket.on("leaderboard_visibility", ({ on }) => setLeaderboardVisible(on));

    return () => {
      clearInterval(timerRef.current);
      socket.off("quiz_start");
      socket.off("quiz_end");
      socket.off("new_question");
      socket.off("update_leaderboard");
      socket.off("leaderboard_visibility");
    };
  }, [quizId, adminKey]);

  // Start or End quiz
  const handleStartOrEndQuiz = () => {
    if (!quizLive) {
      socket.emit("admin_start_quiz", { quizId, adminKey });
      setQuizLive(true);
    } else {
      socket.emit("quiz_end", { quizId });
      setQuizLive(false);
      setCurrentQuestion(null);
      clearInterval(timerRef.current);
      setTimer(0);
    }
  };

  const handleNextQuestion = () => {
    if (!quizLive) return;
    socket.emit("admin_next_question", { quizId, adminKey });
  };

  const handleToggleLeaderboard = (on) => {
    socket.emit("admin_toggle_leaderboard", { quizId, adminKey, on });
    setLeaderboardVisible(on);
  };

  const getTimerBarColor = () => {
    if (!currentQuestion) return "bg-gray-700";
    const total = currentQuestion.timeLimit || 30;
    const ratio = timer / total;

    if (ratio > 0.6) {
      return "bg-cyan-500";
    }
    if (ratio > 0.3) {
      return "bg-yellow-400";
    }

    return "bg-red-500 animate-pulse";
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 flex flex-col items-center space-y-6">
      <h1 className="text-3xl font-bold text-cyan-400 drop-shadow-lg">
        🧑‍🏫 Admin Quiz Control
      </h1>

      {/* --- QR Code --- */}
      <button
        onClick={() => setShowQR(!showQR)}
        className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded transition shadow"
      >
        {showQR ? "Hide QR Code" : "Show QR Code"}
      </button>

      {showQR && typeof window !== "undefined" && (
        <div className="flex flex-col items-center space-y-2">
          <QRCode
            value={`${window.location.origin}/quiz/${quizId}`}
            size={180}
            bgColor="#0f172a"
            fgColor="#22d3ee"
          />
          <p className="text-gray-400 text-sm italic">
            Participants can scan to join
          </p>
        </div>
      )}

      {/* --- Current Question & Timer --- */}
      {currentQuestion ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl p-6 text-center w-full max-w-xl transition-all duration-300">
          <h3 className="text-xl font-semibold text-cyan-400 mb-3">
            Current Question
          </h3>
          <p className="text-lg text-gray-200 mb-3 font-medium">
            {currentQuestion.questionText}
          </p>

          {/* Timer Text */}
          <p className="text-sm text-gray-400 mb-2">
            ⏱ Time Remaining:{" "}
            <span
              className={`font-semibold ${
                timer > 10
                  ? "text-blue-400"
                  : timer > 5
                  ? "text-yellow-400"
                  : "text-red-500 animate-pulse"
              }`}
            >
              {timer}s
            </span>
          </p>

          {/* Progress Bar */}
          <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full ${getTimerBarColor()} transition-all duration-1000`}
              style={{
                width: `${
                  currentQuestion?.timeLimit
                    ? (timer / currentQuestion.timeLimit) * 100
                    : 0
                }%`,
              }}
            ></div>
          </div>
        </div>
      ) : quizLive ? (
        <p className="text-yellow-400 animate-pulse font-medium">
          Waiting for next question...
        </p>
      ) : (
        <p className="text-gray-400 font-medium">Quiz not started yet.</p>
      )}

      {/* --- Controls --- */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        <button
          onClick={handleStartOrEndQuiz}
          className={`px-6 py-2 rounded font-semibold transition shadow ${
            quizLive
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {quizLive ? "End Quiz" : "Start Quiz"}
        </button>
        <button
          onClick={handleNextQuestion}
          className="bg-yellow-600 hover:bg-yellow-700 px-6 py-2 rounded font-semibold disabled:opacity-50 shadow"
          disabled={!quizLive}
        >
          Next Question
        </button>
        <button
          onClick={() => handleToggleLeaderboard(!leaderboardVisible)}
          className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded font-semibold shadow"
        >
          {leaderboardVisible ? "Hide Leaderboard" : "Show Leaderboard"}
        </button>
      </div>

      {/* --- Optional embedded leaderboard --- */}
      {leaderboardVisible && <LeaderboardPanel leaderboard={leaderboard} />}
    </div>
  );
}
