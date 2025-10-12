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
    const body = await req.json();
    const { title, description = "", adminKey } = body;

    if (adminKey !== process.env.ADMIN_KEY)
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );

    await connectDB();
    const quiz = await Quiz.create({ title, description });
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
    const body = await req.json();
    const { quizId, title, description, isLive, adminKey } = body;

    if (adminKey !== process.env.ADMIN_KEY)
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );

    await connectDB();

    const updates = {};
    if (typeof title === "string") updates.title = title;
    if (typeof description === "string") updates.description = description;
    if (typeof isLive === "boolean") updates.isLive = isLive;

    const quiz = await Quiz.findByIdAndUpdate(quizId, updates, { new: true });
    if (!quiz)
      return Response.json(
        { success: false, error: "Quiz not found" },
        { status: 404 }
      );

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
    const body = await req.json();
    const { quizId, adminKey } = body;

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
