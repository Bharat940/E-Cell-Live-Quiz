import { connectDB } from "@/lib/db";
import Quiz from "@/models/Quiz";
import Question from "@/models/Question";

export async function GET() {
  try {
    await connectDB();
    const quizzes = await Quiz.find().sort({ createdAt: -1 }).lean();
    return Response.json({ success: true, data: quizzes });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { title, description = "", adminKey } = await req.json();
    if (adminKey !== process.env.ADMIN_KEY)
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    if (!title || title.trim().length < 3) {
      return Response.json(
        { success: false, error: "Invalid title" },
        { status: 400 }
      );
    }

    await connectDB();
    const quiz = await Quiz.create({
      title: title.trim(),
      description: description?.trim() ?? "",
    });
    return Response.json({ success: true, data: quiz });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const { quizId, title, description, isLive, adminKey } = await req.json();
    if (adminKey !== process.env.ADMIN_KEY) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const updates = {};
    if (typeof title === "string") {
      updates.title = title.trim();
    }
    if (typeof description === "string") {
      updates.description = description.trim();
    }
    if (typeof isLive === "boolean") {
      updates.isLive = isLive;
      if (isLive) updates.startedAt = new Date();
      else updates.currentQuestionIndex = 0;
    }

    const quiz = await Quiz.findByIdAndUpdate(quizId, updates, { new: true });
    if (!quiz) {
      return Response.json(
        { success: false, error: "Quiz not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: quiz });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { quizId, adminKey } = await req.json();
    if (adminKey !== process.env.ADMIN_KEY) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const deletedQuiz = await Quiz.findByIdAndDelete(quizId);
    if (!deletedQuiz) {
      return Response.json(
        { success: false, error: "Quiz not found" },
        { status: 404 }
      );
    }

    await Question.deleteMany({ quizId });

    return Response.json({
      success: true,
      message: "Quiz and its questions deleted successfully",
    });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
