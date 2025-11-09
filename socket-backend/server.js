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
  console.log("New socket connected:", socket.id);

  socket.on("join_quiz", async ({ quizId, participantId }) => {
    if (
      !quizId ||
      !participantId ||
      !mongoose.Types.ObjectId.isValid(quizId) ||
      !mongoose.Types.ObjectId.isValid(participantId)
    ) {
      return;
    }

    socket.join(quizId);
    await Participant.findByIdAndUpdate(participantId, { socketId: socket.id });
    socket.emit("joined", { ok: true });

    const state = quizState.get(quizId);
    if (state?.questionId) {
      const q = await Question.findById(state.questionId);
      if (q) {
        const remaining = Math.max(
          0,
          Math.floor(
            (state.timeLimitMs - (Date.now() - state.startedAt)) / 1000
          )
        );
        socket.emit("new_question", {
          _id: q._id.toString(),
          questionText: q.questionText,
          options: q.options,
          timeLimit: remaining,
        });
      }
    }
  });

  // Admin joins
  socket.on("join_admin", ({ quizId }) => {
    socket.join(`admin_${quizId}`);
    const state = quizState.get(quizId);
    if (state?.questionId) {
      Question.findById(state.questionId).then((q) => {
        if (q) {
          const remaining = Math.max(
            0,
            Math.floor(
              (state.timeLimitMs - (Date.now() - state.startedAt)) / 1000
            )
          );
          socket.emit("new_question", {
            _id: q._id.toString(),
            questionText: q.questionText,
            options: q.options,
            timeLimit: remaining,
          });
        }
      });
    }
  });

  // Presentation joins
  socket.on("join_presentation", ({ quizId }) => {
    socket.join(`presentation_${quizId}`);
    const state = quizState.get(quizId);
    if (state && state.questionId) {
      socket.emit("quiz_start", { quizId });
    } else {
      socket.emit("quiz_end", { quizId });
    }
  });

  // Start quiz
  socket.on("admin_start_quiz", async ({ quizId, adminKey }) => {
    if (adminKey !== process.env.ADMIN_KEY) return;

    const quiz = await Quiz.findByIdAndUpdate(
      quizId,
      { isLive: true, startedAt: new Date(), currentQuestionIndex: 0 },
      { new: true }
    );
    if (!quiz) return;

    quizState.set(quizId, {
      questionId: null,
      startedAt: null,
      timeLimitMs: 0,
      leaderboardOn: false,
    });

    io.to(quizId).emit("quiz_start", { quizId });
    io.to(`presentation_${quizId}`).emit("quiz_start", { quizId });

    const questions = await Question.find({ quizId }).sort({ createdAt: 1 });
    if (questions.length > 0) {
      const q = questions[0];
      await Quiz.findByIdAndUpdate(quizId, { currentQuestionIndex: 1 });

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
        leaderboardOn: false,
      });

      io.to(quizId).emit("new_question", payload);
      io.to(`admin_${quizId}`).emit("new_question", payload);

      setTimeout(() => {
        io.to(quizId).emit("answer_window_close", {
          questionId: q._id.toString(),
        });
      }, q.timeLimit * 1000);
    }
  });

  // Next question
  socket.on("admin_next_question", async ({ quizId, index, adminKey }) => {
    if (adminKey !== process.env.ADMIN_KEY) return;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return;

    const questions = await Question.find({ quizId }).sort({ createdAt: 1 });
    const i = typeof index === "number" ? index : quiz.currentQuestionIndex;
    const q = questions[i];
    if (!q) {
      io.to(quizId).emit("quiz_end", { quizId });
      io.to(`presentation_${quizId}`).emit("quiz_end", { quizId });
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
    });

    io.to(quizId).emit("new_question", payload);
    io.to(`admin_${quizId}`).emit("new_question", payload);

    setTimeout(() => {
      io.to(quizId).emit("answer_window_close", {
        questionId: q._id.toString(),
      });
    }, q.timeLimit * 1000);
  });

  // Submit answer
  socket.on(
    "submit_answer",
    async ({ quizId, participantId, questionId, selectedOption }) => {
      try {
        const state = quizState.get(quizId);
        if (!state || state.questionId !== questionId) return;

        const elapsedMs = Date.now() - state.startedAt;
        if (elapsedMs > state.timeLimitMs) return;

        const q = await Question.findById(questionId);
        if (!q) return;

        const correct = Number(selectedOption) === q.correctIndex;

        // Balanced scoring
        const remain = Math.max(0, state.timeLimitMs - elapsedMs);
        const bonus = Math.round((remain / state.timeLimitMs) * 20); // Max +20
        const delta = correct ? 100 + bonus : 0;

        const participantObjectId = new mongoose.Types.ObjectId(participantId);

        const updated = await Participant.findOneAndUpdate(
          { _id: participantObjectId },
          {
            $inc: { score: delta },
            $push: {
              answers: {
                questionId: q._id,
                selectedOption,
                correct,
                answerTime: elapsedMs,
              },
            },
          },
          { new: true }
        ).lean();

        if (!updated) {
          console.warn("⚠️ No participant found for", participantId);
          return;
        }

        io.to(socket.id).emit("answer_result", {
          correct,
          scoreDelta: delta,
          totalScore: updated.score,
        });

        const top = await Participant.find({ quizId })
          .sort({ score: -1, updatedAt: 1 })
          .limit(10)
          .select("name score")
          .lean();

        io.to(quizId).emit("update_leaderboard", { top });
        io.to(`admin_${quizId}`).emit("update_leaderboard", { top });
        io.to(`presentation_${quizId}`).emit("update_leaderboard", { top });
      } catch (err) {
        console.error("❌ Error in submit_answer:", err.message);
      }
    }
  );

  // Toggle leaderboard
  socket.on("admin_toggle_leaderboard", ({ quizId, adminKey, on }) => {
    if (adminKey !== process.env.ADMIN_KEY) return;
    const prev = quizState.get(quizId) || {};
    quizState.set(quizId, { ...prev, leaderboardOn: !!on });

    io.to(quizId).emit("leaderboard_visibility", { on: !!on });
    io.to(`presentation_${quizId}`).emit("leaderboard_visibility", {
      on: !!on,
    });
  });

  // End quiz
  socket.on("quiz_end", async ({ quizId }) => {
    await Quiz.findByIdAndUpdate(quizId, {
      isLive: false,
      currentQuestionIndex: 0,
    });

    const top = await Participant.find({ quizId })
      .sort({ score: -1, updatedAt: 1 })
      .limit(10)
      .select("name score")
      .lean();

    io.to(quizId).emit("quiz_end", { quizId });
    io.to(`presentation_${quizId}`).emit("quiz_end", { quizId });
    io.to(quizId).emit("update_leaderboard", { top });
    io.to(`admin_${quizId}`).emit("update_leaderboard", { top });
    io.to(`presentation_${quizId}`).emit("update_leaderboard", { top });

    quizState.delete(quizId);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

process.on("SIGINT", async () => {
  console.log("🔻 Shutting down...");
  await mongoose.disconnect();
  server.close(() => process.exit(0));
});

const port = Number(process.env.SOCKET_PORT || 4000);
server.listen(port, () => console.log("Socket server on", port));
