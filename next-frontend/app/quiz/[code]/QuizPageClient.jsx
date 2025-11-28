"use client";

import { useState, useEffect, useRef } from "react";
import { socket } from "@/lib/socket";
import { toast } from "react-toastify";

export default function QuizPageClient({ quizCode }) {
  const [participantName, setParticipantName] = useState("");
  const [participantId, setParticipantId] = useState(null);

  // store the actual Mongo quizId we get from /api/participant/join
  const [quizId, setQuizId] = useState(null);

  const [quizInfo, setQuizInfo] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  const [answerSelected, setAnswerSelected] = useState(null);
  const [answerLocked, setAnswerLocked] = useState(false);

  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // track last answer correctness for color feedback
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(null);

  const handleJoin = async () => {
    if (!participantName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    try {
      const res = await fetch("/api/participant/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: participantName, quizCode }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Join failed");

      setParticipantId(data.data.participantId);
      setQuizId(data.data.quizId); // save ObjectId

      setQuizInfo({
        title: data.data.title,
        description: data.data.description,
      });
      setQuizStarted(data.data.isLive);

      // join the quiz room using the real quizId
      socket.emit("join_quiz", {
        quizId: data.data.quizId,
        participantId: data.data.participantId,
      });
    } catch (err) {
      toast.error(err.message || "Failed to join quiz");
    }
  };

  const handleSubmitAnswer = () => {
    if (answerSelected === null || answerLocked) return;
    if (!quizId) return; // safety

    // send Mongo quizId (NOT the 6-char code)
    socket.emit("submit_answer", {
      quizId,
      participantId,
      questionId: currentQuestion._id,
      selectedOption: answerSelected,
    });

    setAnswerLocked(true);
  };

  useEffect(() => {
    if (!participantId) return;

    const onQuizStart = () => {
      setQuizStarted(true);
      setShowLeaderboard(false);
    };

    const onNewQuestion = (q) => {
      setCurrentQuestion(q);
      setAnswerLocked(false);
      setAnswerSelected(null);
      setLastAnswerCorrect(null);
      setTimeLeft(q.timeLimit);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            setAnswerLocked(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    };

    const onAnswerResult = ({ totalScore, correct }) => {
      // update score and correctness for color feedback
      if (typeof totalScore === "number") setScore(totalScore);
      setLastAnswerCorrect(!!correct);
    };

    const onAnswerWindowClose = () => setAnswerLocked(true);

    const onQuizEnd = () => {
      setQuizStarted(false);
      setCurrentQuestion(null);
      setShowLeaderboard(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    const onUpdateLeaderboard = ({ top }) => setLeaderboard(top || []);

    socket.on("quiz_start", onQuizStart);
    socket.on("new_question", onNewQuestion);
    socket.on("answer_result", onAnswerResult);
    socket.on("answer_window_close", onAnswerWindowClose);
    socket.on("quiz_end", onQuizEnd);
    socket.on("update_leaderboard", onUpdateLeaderboard);

    return () => {
      socket.off("quiz_start", onQuizStart);
      socket.off("new_question", onNewQuestion);
      socket.off("answer_result", onAnswerResult);
      socket.off("answer_window_close", onAnswerWindowClose);
      socket.off("quiz_end", onQuizEnd);
      socket.off("update_leaderboard", onUpdateLeaderboard);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [participantId]);

  if (!participantId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-5 bg-gray-950 text-white">
        <h1 className="text-4xl font-bold text-cyan-400">Join the Quiz</h1>
        <input
          type="text"
          placeholder="Enter your name"
          className="bg-gray-800 border border-gray-700 text-white p-3 rounded-lg w-72 text-center focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          value={participantName}
          onChange={(e) => setParticipantName(e.target.value)}
        />
        <button
          onClick={handleJoin}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-200"
        >
          Join Quiz
        </button>
      </div>
    );
  }

  if (showLeaderboard) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-8">
        <h1 className="text-3xl font-bold mb-6 text-cyan-400">
          🏆 Final Leaderboard
        </h1>
        <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md p-4">
          {leaderboard.length ? (
            leaderboard.map((p, i) => (
              <div
                key={i}
                className="flex justify-between py-2 border-b border-gray-700"
              >
                <span>
                  {i + 1}.{" "}
                  <span className="text-cyan-400 font-semibold">{p.name}</span>
                </span>
                <span className="text-gray-300">{p.score}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center">No participants active</p>
          )}
        </div>
      </div>
    );
  }

  if (!quizStarted || !currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-center px-4 text-gray-300">
        <h1 className="text-3xl font-bold text-cyan-400 mb-2">
          {quizInfo?.title || "Quiz Not Live"}
        </h1>
        <p className="text-gray-400 mb-6">{quizInfo?.description}</p>
        <p className="animate-pulse text-blue-400 font-medium">
          {quizStarted ? "Waiting for next question..." : "Quiz not live yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Participant Info Header */}
        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-4 mb-6 shadow-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/50">
                <span className="text-xl">👤</span>
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-400">Participant</p>
                <p className="text-lg font-bold text-cyan-400">{participantName}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Current Score</p>
              <p className="text-2xl font-bold text-blue-400">{score}</p>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-cyan-500/30 rounded-2xl shadow-2xl p-6 md:p-8">
          {/* Question Text */}
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white leading-relaxed text-center">
              {currentQuestion.questionText}
            </h2>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3 mb-6">
            {currentQuestion.options.map((opt, i) => {
              const isSelected = answerSelected !== null && answerSelected === i;

              // After submit, color the selected option:
              //    - green if correct
              //    - red if wrong
              //    - DO NOT reveal the correct option if user was wrong
              let postSubmitClasses = "";
              if (answerLocked && isSelected && lastAnswerCorrect !== null) {
                postSubmitClasses =
                  lastAnswerCorrect === true
                    ? "bg-green-600 border-green-500 text-white"
                    : "bg-red-600 border-red-500 text-white";
              }

              const baseClasses = isSelected
                ? "bg-cyan-600 border-cyan-500 text-white shadow-lg scale-105"
                : "bg-gray-800/50 hover:bg-gray-700 border-gray-700 text-gray-200";

              return (
                <button
                  key={i}
                  disabled={answerLocked}
                  onClick={() => setAnswerSelected(i)}
                  className={`w-full p-4 rounded-xl font-medium transition-all duration-200 border text-left
                    ${!answerLocked ? baseClasses : ""}
                    ${answerLocked && isSelected ? postSubmitClasses : ""}
                    ${answerLocked && !isSelected ? "bg-gray-800/30 border-gray-700/50 text-gray-400" : ""}
                  `}
                >
                  <span className="font-semibold text-cyan-400 mr-2">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitAnswer}
            disabled={answerLocked || answerSelected === null}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all transform ${answerLocked
                ? "bg-gray-700 cursor-not-allowed text-gray-400"
                : answerSelected !== null
                  ? "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg hover:scale-105"
                  : "bg-gray-700 cursor-not-allowed text-gray-500"
              }`}
          >
            {answerLocked ? "✓ Answer Submitted" : "Submit Answer"}
          </button>

          {/* Timer Section */}
          <div className="mt-6 bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-400 font-medium">⏱ Time Remaining</span>
              <span
                className={`text-3xl font-bold tabular-nums ${timeLeft > 10
                    ? "text-cyan-400"
                    : timeLeft > 5
                      ? "text-yellow-400"
                      : "text-red-500 animate-pulse"
                  }`}
              >
                {timeLeft}s
              </span>
            </div>

            {/* Timer Bar */}
            <div className="h-3 w-full bg-gray-900 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-1000 ease-linear shadow-lg ${timeLeft > 10
                    ? "bg-cyan-500"
                    : timeLeft > 5
                      ? "bg-yellow-400"
                      : "bg-red-500 animate-pulse"
                  }`}
                style={{
                  width: `${currentQuestion?.timeLimit
                    ? (timeLeft / currentQuestion.timeLimit) * 100
                    : 0
                    }%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
