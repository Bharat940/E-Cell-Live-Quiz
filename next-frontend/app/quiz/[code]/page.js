import QuizPageClient from "./QuizPageClient.jsx";

export default async function QuizPage({ params }) {
  const resolvedParams = await params;
  return <QuizPageClient quizCode={resolvedParams.code} />;
}
