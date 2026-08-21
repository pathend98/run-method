import { sampleWeek, TrainingPlanner } from "@/ui/training-planner";

export default function Home() {
  return (
    <main>
      <TrainingPlanner week={sampleWeek} />
    </main>
  );
}
