import { QueryProvider } from "./query-provider";
import { TrainingPlannerContainer } from "@/ui/training-planner/training-planner";

export default function Home() {
  return (
    <main>
      <QueryProvider>
        <TrainingPlannerContainer />
      </QueryProvider>
    </main>
  );
}
