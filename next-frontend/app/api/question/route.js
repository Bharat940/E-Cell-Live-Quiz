import { connectDB } from "@/lib/db";
import Question from "@/models/Question";
import Quiz from "@/models/Quiz";
import { cookies } from "next/headers";

async function requireAdmin() {
  const cookieStore = await cookies();
  const adminKey = cookieStore.get("adminKey")?.value;

  if (adminKey !== process.env.ADMIN_KEY) {
    return Response.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return null;
}

export async function POST(req) {
  const auth = await requireAdmin();
  if (auth) return auth;

  try {
    const { quizId, questionText, options, correctIndex, timeLimit } =
      await req.json();

    if (!questionText?.trim()) {
      return Response.json(
        { success: false, error: "Question text is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(options) || options.length < 2) {
      return Response.json(
        { success: false, error: "At least two options are required" },
        { status: 400 }
      );
    }

    if (
      typeof correctIndex !== "number" ||
      correctIndex < 0 ||
      correctIndex > options.length
    ) {
      return Response.json(
        { success: false, error: "Invalid correct option index" },
        { status: 400 }
      );
    }

    const tl = Number(timeLimit ?? 30);
    if (Number.isNaN(tl) || tl <= 0) {
      return Response.json(
        { success: false, error: "Invalid time limit" },
        { status: 400 }
      );
    }

    await connectDB();

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return Response.json(
        { success: false, error: "Quiz not found" },
        { status: 404 }
      );
    }

    const question = await Question.create({
      quizId,
      questionText: questionText.trim(),
      options: options.map((o) => `${o}`.trim()),
      correctIndex,
      timeLimit: tl,
    });

    return Response.json({ success: true, data: question });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get("quizId");

    const filter = quizId ? { quizId } : {};
    const questions = await Question.find(filter).lean();

    return Response.json({ success: true, data: questions });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  const auth = await requireAdmin();
  if (auth) {
    return auth;
  }

  try {
    const { questionId, questionText, options, correctIndex, timeLimit } =
      await req.json();

    await connectDB();

    const updates = {};
    if (typeof questionText === "string" && questionText.trim()) {
      updates.questionText = questionText.trim();
    }
    if (Array.isArray(options) && options.length >= 2) {
      updates.options = options.map((o) => `${o}`.trim());
    }
    if (typeof correctIndex === "number") {
      updates.correctIndex = correctIndex;
    }
    if (typeof timeLimit === "number") {
      updates.timeLimit = timeLimit;
    }

    if (updates.options && typeof updates.correctIndex === "number") {
      if (
        updates.correctIndex < 0 ||
        updates.correctIndex >= updates.options.length
      ) {
        return Response.json(
          { success: false, error: "Invalid correct option index" },
          { status: 400 }
        );
      }
    }

    const question = await Question.findByIdAndUpdate(questionId, updates, {
      new: true,
    });
    if (!question) {
      return Response.json(
        { success: false, error: "Question not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: question });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  const auth = await requireAdmin();
  if (auth) {
    return auth;
  }

  try {
    const { questionId } = await req.json();

    await connectDB();

    const deleted = await Question.findByIdAndDelete(questionId);
    if (!deleted) {
      return Response.json(
        { success: false, error: "Question not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
