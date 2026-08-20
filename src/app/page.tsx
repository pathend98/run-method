import { sampleWeek, TrainingPlanner } from "@/components/training-planner";

export default function Home() {
  return (
    <main>
      <TrainingPlanner week={sampleWeek} />
    </main>
  );
}
