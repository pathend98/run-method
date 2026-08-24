import { QueryProvider } from "./query-provider";
import { TrainingPlanner } from "@/ui/training-planner/training-planner";

export default function Home() {
  return (
    <main>
      <QueryProvider>
        <TrainingPlanner />
      </QueryProvider>
    </main>
  );
}
