"use client";

import { useState, useEffect } from "react";
import { socket } from "@/lib/socket";

export default function QuizPageClient({ quizCode }) {
  const [participantName, setParticipantName] = useState("");
  const [participantId, setParticipantId] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answerSelected, setAnswerSelected] = useState(null);
  const [answerLocked, setAnswerLocked] = useState(false);
  const [score, setScore] = useState(0);

  const handleJoin = async () => {
    if (!participantName.trim()) {
      alert("Please enter your name");
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
    setAnswerLocked(true);
    setAnswerSelected(optionIndex);

    socket.emit("submit_answer", {
      quizId: quizCode,
      participantId,
      questionId: currentQuestion._id,
      selectedOption: optionIndex,
    });
  };

  useEffect(() => {
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
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold">Join Quiz</h1>
        <input
          type="text"
          placeholder="Enter your name"
          className="border p-2 rounded"
          value={participantName}
          onChange={(e) => setParticipantName(e.target.value)}
        />
        <button
          onClick={handleJoin}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Join
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
      {!quizStarted && (
        <p className="text-lg text-gray-500">Waiting for quiz to start...</p>
      )}

      {quizStarted && currentQuestion && (
        <div className="w-full max-w-lg text-center">
          <h2 className="text-xl font-bold mb-4">
            {currentQuestion.questionText}
          </h2>
          <div className="flex flex-col gap-2">
            {currentQuestion.options.map((opt, i) => (
              <button
                key={i}
                disabled={answerLocked}
                onClick={() => handleAnswer(i)}
                className={`p-2 rounded border ${
                  answerSelected === i
                    ? "bg-blue-500 text-white"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          <p className="mt-3 text-gray-600">
            Time Left: <b>{timeLeft}s</b>
          </p>
          <p className="mt-2">Score: {score}</p>
        </div>
      )}
    </div>
  );
}
