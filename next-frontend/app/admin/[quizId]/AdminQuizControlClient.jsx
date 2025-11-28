"use client";

import { useEffect, useState, useRef } from "react";
import QRCode from "react-qr-code";
import { socket } from "@/lib/socket";
import LeaderboardPanel from "@/app/components/LeaderboardPanel";
import { toast } from "react-toastify";

export default function AdminQuizControlClient({ quizId }) {
  const [adminKey, setAdminKey] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [showQR, setShowQR] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [quizLive, setQuizLive] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  const [hasNextQuestion, setHasNextQuestion] = useState(false);
  const [allQuestions, setAllQuestions] = useState([]);
  const [showEndQuizModal, setShowEndQuizModal] = useState(false);
  const [showDeleteParticipantsModal, setShowDeleteParticipantsModal] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const loadAdminKey = async () => {
      try {
        const res = await fetch("/api/admin/me", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.adminKey) {
          setAdminKey(data.adminKey);
        }
      } catch (err) {
        console.error("Failed to load admin key", err);
      }
    };

    loadAdminKey();
  }, []);

  // Fetch quiz data to get quizCode
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await fetch(`/api/quiz?_id=${quizId}`);
        const data = await res.json();
        if (data.success) {
          setQuiz(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch quiz", err);
      }
    };

    fetchQuiz();
  }, [quizId]);

  // Fetch all questions for this quiz
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`/api/question?quizId=${quizId}`);
        const data = await res.json();
        if (data.success) {
          setAllQuestions(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch questions", err);
      }
    };

    fetchQuestions();
  }, [quizId]);

  useEffect(() => {
    // Join the admin room to receive real-time updates
    socket.emit("join_admin", { quizId });

    // When quiz starts
    socket.on("quiz_start", () => {
      setQuizLive(true);
    });

    // When quiz ends
    socket.on("quiz_end", () => {
      setQuizLive(false);
      setCurrentQuestion(null);
      setHasNextQuestion(false);
      clearInterval(timerRef.current);
      setTimer(0);
    });

    // When a new question appears
    socket.on("new_question", (q) => {
      setCurrentQuestion(q);

      if (q.index === q.total - 1) {
        setHasNextQuestion(false);
      } else {
        setHasNextQuestion(true);
      }

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

    socket.on("participant_count", ({ count }) => setParticipantCount(count));

    socket.on("participants_reset_success", () => {
      toast.success("All participants deleted successfully");
      setShowDeleteParticipantsModal(false);
    });

    return () => {
      clearInterval(timerRef.current);
      socket.off("quiz_start");
      socket.off("quiz_end");
      socket.off("new_question");
      socket.off("update_leaderboard");
      socket.off("participant_count");
      socket.off("participants_reset_success");
    };
  }, [quizId]);

  // Start or End quiz
  const handleStartQuiz = () => {
    if (!adminKey) {
      toast.error("Admin key missing. Please login again.");
      return;
    }
    socket.emit("admin_start_quiz", { quizId, adminKey });
    setQuizLive(true);
    // Initialize leaderboard as visible when quiz starts
    setShowLeaderboard(true);
    socket.emit("admin_toggle_leaderboard", { quizId, adminKey, on: true });
  };

  const handleEndQuiz = () => {
    if (!adminKey) {
      toast.error("Admin key missing. Please login again.");
      return;
    }
    // Show confirmation modal
    setShowEndQuizModal(true);
  };

  const confirmEndQuiz = () => {
    socket.emit("quiz_end", { quizId });
    setQuizLive(false);
    setCurrentQuestion(null);
    setHasNextQuestion(false);
    clearInterval(timerRef.current);
    setTimer(0);
    setShowEndQuizModal(false);
    toast.success("Quiz ended successfully");
  };

  const handleNextQuestion = () => {
    if (!quizLive || !hasNextQuestion) return;
    if (!adminKey) {
      toast.error("Admin key missing. Please login again.");
      return;
    }
    socket.emit("admin_next_question", { quizId, adminKey });
  };

  const handleToggleLeaderboard = () => {
    if (!adminKey) {
      toast.error("Admin key missing. Please login again.");
      return;
    }
    const newVisibility = !showLeaderboard;
    setShowLeaderboard(newVisibility);
    // Emit socket event to control presentation page leaderboard visibility
    socket.emit("admin_toggle_leaderboard", { quizId, adminKey, on: newVisibility });
  };

  const handleJumpToQuestion = (index) => {
    if (!adminKey) {
      toast.error("Admin key missing. Please login again.");
      return;
    }
    socket.emit("admin_next_question", { quizId, adminKey, index });
  };

  const handleDeleteParticipants = () => {
    if (!adminKey) {
      toast.error("Admin key missing. Please login again.");
      return;
    }
    setShowDeleteParticipantsModal(true);
  };

  const confirmDeleteParticipants = () => {
    socket.emit("admin_reset_participants", { quizId, adminKey });
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Admin Quiz Control
          </h1>

          {/* Quiz Status Badge */}
          <div className={`px-4 py-2 rounded-full font-semibold text-sm ${quizLive
            ? "bg-green-500/20 text-green-400 border border-green-500/50"
            : "bg-gray-700/50 text-gray-400 border border-gray-600/50"
            }`}>
            {quizLive ? "🟢 Quiz Live" : "⚫ Quiz Stopped"}
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* QR Code Section */}
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-cyan-400">Join Quiz</h2>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition"
                >
                  {showQR ? "Hide QR" : "Show QR"}
                </button>
              </div>

              {/* Always show quiz code */}
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-2">Quiz Code:</p>
                <p className="text-2xl font-bold font-mono text-cyan-400 bg-gray-800 px-4 py-3 rounded-lg text-center tracking-wider">
                  {quiz?.quizCode || "Loading..."}
                </p>
              </div>

              {/* Toggleable QR Code */}
              {showQR && (
                <div className="flex flex-col items-center space-y-3 bg-white p-4 rounded-xl">
                  {mounted && quiz?.quizCode ? (
                    <>
                      <QRCode
                        value={`${window.location.origin}/quiz/${quiz.quizCode}`}
                        size={200}
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                      <p className="text-gray-600 text-xs text-center font-medium">
                        Scan to join quiz
                      </p>
                    </>
                  ) : (
                    <div className="w-[200px] h-[200px] bg-gray-200 rounded flex items-center justify-center">
                      <p className="text-gray-500 text-sm">Loading QR...</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quiz Controls */}
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-xl font-bold text-cyan-400 mb-4">Controls</h2>

              {!quizLive ? (
                <button
                  onClick={handleStartQuiz}
                  disabled={allQuestions.length === 0}
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105 disabled:hover:scale-100"
                >
                  {allQuestions.length === 0 ? "⚠️ No Questions" : "▶️ Start Quiz"}
                </button>
              ) : (
                <button
                  onClick={handleEndQuiz}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105"
                >
                  ⏹️ End Quiz
                </button>
              )}

              {quizLive && hasNextQuestion && (
                <button
                  onClick={handleNextQuestion}
                  className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105"
                >
                  ⏭️ Next Question
                </button>
              )}

              {quizLive && !hasNextQuestion && currentQuestion && (
                <div className="w-full bg-gradient-to-r from-orange-600/20 to-orange-500/20 border border-orange-500/50 px-4 py-3 rounded-xl text-center">
                  <p className="text-orange-400 font-semibold text-sm">
                    🏁 Last Question - Click "End Quiz" when ready
                  </p>
                </div>
              )}

              <button
                onClick={handleToggleLeaderboard}
                className="w-full bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
              >
                {showLeaderboard ? "📊 Hide Leaderboard" : "📊 Show Leaderboard"}
              </button>

              <div className="pt-4 border-t border-gray-800">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-400 text-sm">Active Participants:</span>
                  <span className="text-cyan-400 font-bold text-lg">{participantCount}</span>
                </div>
                <button
                  onClick={handleDeleteParticipants}
                  className="w-full bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 text-red-400 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all text-sm"
                >
                  🗑️ Delete All Participants
                </button>
              </div>
            </div>

            {/* Question Navigator */}
            {quizLive && allQuestions.length > 0 && (
              <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-xl font-bold text-cyan-400 mb-4">Jump to Question</h2>
                <div className="grid grid-cols-4 gap-2">
                  {allQuestions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleJumpToQuestion(index)}
                      className={`px-3 py-2 rounded-lg font-semibold transition-all ${currentQuestion?.index === index
                        ? "bg-cyan-500 text-white shadow-lg scale-110"
                        : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                        }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Question & Leaderboard */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Question Display */}
            {currentQuestion ? (
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-cyan-500/30 rounded-2xl shadow-2xl p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-semibold text-cyan-400">
                        Question {(currentQuestion.index || 0) + 1} of {currentQuestion.total || allQuestions.length}
                      </h3>
                      {!hasNextQuestion && (
                        <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-2 py-1 rounded-full border border-orange-500/50">
                          🏁 FINAL
                        </span>
                      )}
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-white leading-relaxed">
                      {currentQuestion.questionText}
                    </p>
                  </div>
                </div>

                {/* Options Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {currentQuestion.options?.map((opt, i) => (
                    <div
                      key={i}
                      className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-gray-300"
                    >
                      <span className="font-semibold text-cyan-400 mr-2">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {opt}
                    </div>
                  ))}
                </div>

                {/* Timer Section */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-400 font-medium">Time Remaining</span>
                    <span
                      className={`text-3xl font-bold tabular-nums ${timer > 10
                        ? "text-cyan-400"
                        : timer > 5
                          ? "text-yellow-400"
                          : "text-red-500 animate-pulse"
                        }`}
                    >
                      {timer}s
                    </span>
                  </div>

                  <div className="h-3 w-full bg-gray-900 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full ${getTimerBarColor()} transition-all duration-1000 ease-linear shadow-lg`}
                      style={{
                        width: `${currentQuestion?.timeLimit
                          ? (timer / currentQuestion.timeLimit) * 100
                          : 0
                          }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : quizLive ? (
              <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-12 text-center shadow-xl">
                <div className="animate-pulse">
                  <p className="text-2xl font-bold text-yellow-400 mb-2">⏳ Waiting for next question...</p>
                  <p className="text-gray-400">Click "Next Question" to continue</p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-12 text-center shadow-xl">
                <p className="text-2xl font-bold text-gray-400 mb-2">🎯 Quiz Not Started</p>
                <p className="text-gray-500">Click "Start Quiz" to begin</p>
                {allQuestions.length > 0 && (
                  <p className="text-cyan-400 mt-4 text-sm">
                    {allQuestions.length} question{allQuestions.length !== 1 ? 's' : ''} ready
                  </p>
                )}
              </div>
            )}

            {/* Admin Leaderboard */}
            {showLeaderboard && (
              <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-2xl font-bold text-cyan-400 mb-4">
                  🏆 Live Leaderboard
                </h2>
                <LeaderboardPanel leaderboard={leaderboard} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* End Quiz Confirmation Modal */}
      {showEndQuizModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-red-500/30 rounded-2xl shadow-2xl p-8 max-w-md w-full animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">End Quiz?</h2>
              <p className="text-gray-400">
                Are you sure you want to end this quiz? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEndQuizModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105"
              >
                No, Cancel
              </button>
              <button
                onClick={confirmEndQuiz}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105"
              >
                Yes, End Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Participants Confirmation Modal */}
      {showDeleteParticipantsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-red-500/30 rounded-2xl shadow-2xl p-8 max-w-md w-full animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🗑️</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Delete All Participants?</h2>
              <p className="text-gray-400">
                This will remove all {participantCount} participants and their scores. This action CANNOT be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteParticipantsModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105"
              >
                No, Cancel
              </button>
              <button
                onClick={confirmDeleteParticipants}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
