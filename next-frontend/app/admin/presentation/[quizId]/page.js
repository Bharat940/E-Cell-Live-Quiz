import PresentationClient from "./PresentationClient";

export default async function PresentationPage({ params }) {
  const { quizId } = await params;
  return <PresentationClient quizId={quizId} />;
}
