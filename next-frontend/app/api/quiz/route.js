import { connectDB } from "@/lib/db";
import Quiz from "@/models/Quiz";
import Question from "@/models/Question";
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

export async function GET(req) {
  try {
    await connectDB();
    
    // Check if requesting a single quiz by ID
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('_id');
    
    if (quizId) {
      // Fetch single quiz
      const quiz = await Quiz.findById(quizId).lean();
      if (!quiz) {
        return Response.json(
          { success: false, error: "Quiz not found" },
          { status: 404 }
        );
      }
      return Response.json({ success: true, data: quiz });
    }
    
    // Fetch all quizzes
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
  const auth = await requireAdmin();
  if (auth) {
    return auth;
  }

  try {
    const { title, description = "" } = await req.json();

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
  const auth = await requireAdmin();
  if (auth) {
    return auth;
  }

  try {
    const { quizId, title, description, isLive } = await req.json();

    await connectDB();

    const updates = {};
    if (title) updates.title = title.trim();
    if (description) updates.description = description.trim();
    if (typeof isLive === "boolean") {
      updates.isLive = isLive;
      updates.startedAt = isLive ? new Date() : undefined;
      if (!isLive) updates.currentQuestionIndex = 0;
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
  const auth = await requireAdmin();
  if (auth) return auth;

  try {
    const { quizId } = await req.json();

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
