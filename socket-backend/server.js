import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import Quiz from "./models/Quiz.js";
import Question from "./models/Question.js";
import Participant from "./models/Participant.js";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: false,
  })
);
app.use(express.json());
app.get("/health", (_, res) => res.json({ ok: true }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || "*", credentials: true },
});

await mongoose.connect(process.env.MONGODB_URI);

console.log("✅ Connected to MongoDB:", mongoose.connection.name);

const quizState = new Map();

io.on("connection", (socket) => {
  socket.on("join_quiz", async ({ quizId, participantId }) => {
    if (!quizId || !participantId) {
      return;
    }

    if (
      !mongoose.Types.ObjectId.isValid(quizId) ||
      !mongoose.Types.ObjectId.isValid(participantId)
    ) {
      return;
    }

    socket.join(quizId);
    await Participant.findByIdAndUpdate(participantId, { socketId: socket.id });
    socket.emit("joined", { ok: true });
  });

  socket.on("admin_start_quiz", async ({ quizId, adminKey }) => {
    if (adminKey !== process.env.ADMIN_KEY) {
      return;
    }

    await Quiz.findByIdAndUpdate(quizId, {
      isLive: true,
      startedAt: new Date(),
      currentQuestionIndex: 0,
    });

    const prev = quizState.get(quizId) || {};

    quizState.set(quizId, {
      ...prev,
      questionId: null,
      startedAt: null,
      timeLimitMs: 0,
      leaderboardOn: prev.leaderboardOn ?? false,
    });

    io.to(quizId).emit("quiz_start", { quizId });
  });

  socket.on("admin_toggle_leaderboard", ({ quizId, adminKey, on }) => {
    if (adminKey !== process.env.ADMIN_KEY) {
      return;
    }

    const prev = quizState.get(quizId) || {};

    quizState.set(quizId, { ...prev, leaderboardOn: !!on });
    io.to(quizId).emit("leaderboard_visibility", { on: !!on });
  });

  socket.on("admin_next_question", async ({ quizId, index, adminKey }) => {
    if (adminKey !== process.env.ADMIN_KEY) {
      return;
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return;
    }

    const questions = await Question.find({ quizId }).sort({ createdAt: 1 });
    const i = typeof index === "number" ? index : quiz.currentQuestionIndex;
    const q = questions[i];
    if (!q) {
      io.to(quizId).emit("quiz_end", { quizId });
      return;
    }

    await Quiz.findByIdAndUpdate(quizId, { currentQuestionIndex: i + 1 });
    const payload = {
      _id: q._id.toString(),
      questionText: q.questionText,
      options: q.options,
      timeLimit: q.timeLimit,
    };

    quizState.set(quizId, {
      questionId: q._id.toString(),
      startedAt: Date.now(),
      timeLimitMs: q.timeLimit * 1000,
      leaderboardOn: quizState.get(quizId)?.leaderboardOn ?? false,
    });

    io.to(quizId).emit("new_question", payload);

    setTimeout(
      () =>
        io
          .to(quizId)
          .emit("answer_window_close", { questionId: q._id.toString() }),
      q.timeLimit * 1000
    );
  });

  socket.on(
    "submit_answer",
    async ({ quizId, participantId, questionId, selectedOption }) => {
      const state = quizState.get(quizId);
      if (!state || state.questionId !== questionId) {
        return;
      }

      const elapsedMs = Date.now() - state.startedAt;
      if (elapsedMs > state.timeLimitMs) {
        return;
      }

      const q = await Question.findById(questionId);
      if (!q) {
        return;
      }

      const correct = Number(selectedOption) === q.correctIndex;
      const remain = Math.max(0, state.timeLimitMs - elapsedMs);
      const bonus = Math.round((remain / state.timeLimitMs) * 5000);

      let delta = correct ? 1000 + bonus : 0;

      const updated = await Participant.findByIdAndUpdate(
        participantId,
        {
          $inc: { score: delta },
          $push: {
            answers: {
              questionId: q._id,
              selectedOption,
              correct,
              answerTimeMs: elapsedMs,
            },
          },
        },
        { new: true }
      ).lean();

      io.to(socket.id).emit("answer_result", {
        correct,
        scoreDelta: delta,
        totalScore: updated?.score ?? 0,
      });

      const st = quizState.get(quizId);
      if (st?.leaderboardOn) {
        const top = await Participant.find({ quizId })
          .sort({ score: -1, updatedAt: 1 })
          .limit(10)
          .select("name score")
          .lean();

        io.to(quizId).emit("update_leaderboard", { top });
      }
    }
  );

  socket.on("disconnect", () => {});
});

process.on("SIGINT", async () => {
  console.log("🔻 Shutting down...");
  await mongoose.disconnect();
  server.close(() => process.exit(0));
});

const port = Number(process.env.SOCKET_PORT || 4000);
server.listen(port, () => console.log("Socket server on", port));
