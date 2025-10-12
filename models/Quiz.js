import mongoose from "mongoose";

function generateQuizCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  quizCode: { type: String, unique: true, default: generateQuizCode },
  isLive: { type: Boolean, default: false },
  currentQuestionIndex: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);
