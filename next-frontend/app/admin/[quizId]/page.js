import AdminQuizControlClient from "./AdminQuizControlClient";

export default async function AdminQuizControlPage({ params }) {
  const { quizId } = await params;
  return <AdminQuizControlClient quizId={quizId} />;
}
