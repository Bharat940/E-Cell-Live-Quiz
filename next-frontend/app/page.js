"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function HomePage() {
  const [quizCode, setQuizCode] = useState("");
  const router = useRouter();

  const handleJoin = () => {
    if (quizCode.trim().length !== 6) {
      toast.error("Enter a valid 6-character quiz code!");
      return;
    }
    router.push(`/quiz/${quizCode.toUpperCase()}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8 w-80 text-center">
        <h1 className="text-3xl font-bold mb-5 text-cyan-400 tracking-wide">
          Join a Quiz
        </h1>

        <input
          type="text"
          placeholder="Enter Quiz Code"
          value={quizCode}
          onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
          className="bg-gray-800 text-center tracking-widest text-lg placeholder-gray-500 border border-gray-700 p-3 w-full mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          maxLength={6}
        />

        <button
          onClick={handleJoin}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:from-cyan-400 hover:to-blue-500 transition-all duration-200"
        >
          Join Quiz
        </button>
      </div>

      <p className="text-gray-500 mt-6 text-sm">
        Enter the{" "}
        <span className="text-cyan-400 font-medium">6-character code</span>{" "}
        provided by E-Cell
      </p>
    </div>
  );
}
