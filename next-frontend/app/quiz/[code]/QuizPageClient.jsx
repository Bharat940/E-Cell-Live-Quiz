"use client";

import { useState, useEffect } from "react";
import { socket } from "@/lib/socket";

export default function QuizPageClient({ quizCode }) {
  const [participantName, setParticipantName] = useState("");
  const [participantId, setParticipantId] = useState(null);
  const [quizInfo, setQuizInfo] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answerSelected, setAnswerSelected] = useState(null);
  const [answerLocked, setAnswerLocked] = useState(false);
  const [score, setScore] = useState(0);

  const handleJoin = async () => {
    if (!participantName.trim()) return alert("Please enter your name");

    try {
      const res = await fetch("/api/participant/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: participantName, quizCode }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Join failed");

      setParticipantId(data.data.participantId);
      setQuizInfo({
        title: data.data.title,
        description: data.data.description,
      });
      setQuizStarted(data.data.isLive);

      socket.emit("join_quiz", {
        quizId: data.data.quizId,
        participantId: data.data.participantId,
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAnswer = (optionIndex) => {
    if (answerLocked) return;
    setAnswerSelected(optionIndex);

    socket.emit("submit_answer", {
      quizId: quizCode,
      participantId,
      questionId: currentQuestion._id,
      selectedOption: optionIndex,
    });
  };

  useEffect(() => {
    if (!participantId) return;

    socket.on("quiz_start", () => setQuizStarted(true));

    socket.on("new_question", (q) => {
      setCurrentQuestion(q);
      setAnswerLocked(false);
      setAnswerSelected(null);
      setTimeLeft(q.timeLimit);

      const timer = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timer);
            setAnswerLocked(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    });

    socket.on("answer_window_close", () => setAnswerLocked(true));
    socket.on("answer_result", ({ totalScore }) => setScore(totalScore));
    socket.on("quiz_end", () => {
      setQuizStarted(false);
      setCurrentQuestion(null);
    });

    return () => socket.off();
  }, [participantId]);

  if (!participantId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-gray-50">
        <h1 className="text-3xl font-bold text-gray-800">Join Quiz</h1>
        <input
          type="text"
          placeholder="Enter your name"
          className="border border-gray-300 p-2 rounded w-64 focus:outline-none focus:ring focus:ring-blue-200"
          value={participantName}
          onChange={(e) => setParticipantName(e.target.value)}
        />
        <button
          onClick={handleJoin}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow"
        >
          Join
        </button>
      </div>
    );
  }

  if (!quizStarted || !currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {quizInfo?.title || "Waiting for quiz"}
        </h1>
        <p className="text-gray-600 mb-6">{quizInfo?.description}</p>
        <p className="text-gray-500 animate-pulse">
          Waiting for quiz to start...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-2xl p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {currentQuestion.questionText}
        </h2>

        <div className="flex flex-col gap-3">
          {currentQuestion.options.map((opt, i) => {
            const isSelected = answerSelected === i;
            return (
              <button
                key={i}
                disabled={answerLocked}
                onClick={() => handleAnswer(i)}
                className={`w-full p-3 rounded-lg border text-gray-800 font-medium transition-all duration-200
                  ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-100 hover:bg-blue-100 border-gray-300"
                  }
                  ${answerLocked && !isSelected ? "opacity-60" : ""}
                `}
              >
                {opt}
              </button>
            );
          })}
        </div>

        <div className="mt-6 text-gray-600 flex justify-between text-sm">
          <span>
            Time Left: <b>{timeLeft}s</b>
          </span>
          <span>
            Score: <b>{score}</b>
          </span>
        </div>
      </div>
    </div>
  );
}
