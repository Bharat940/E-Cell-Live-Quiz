import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  timeLimit: { type: Number, default: 30 }, // seconds
});

export default mongoose.models.Question ||
  mongoose.model("Question", questionSchema);
