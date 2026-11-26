import { Button } from "@/ui/shared/button/button";

type TrainingGoalIntroductionProps = { onStart: () => void };

export function TrainingGoalIntroduction({
  onStart,
}: TrainingGoalIntroductionProps) {
  return (
    <div className="max-w-xl space-y-4 text-zinc-700">
      <h2 className="text-xl font-semibold text-zinc-950">
        Give your training direction
      </h2>
      <p>
        A training goal is a period of intentional training, focused on
        developing yourself as a runner.
      </p>
      <p>
        You might be preparing for a race, rebuilding fitness or becoming more
        consistent.
      </p>
      <p>
        Whatever you&apos;re working towards, focus on the things you can
        control: how you train, how you recover and how you develop over time.
      </p>
      <hr className="border-zinc-200" />
      <p>
        You don&apos;t need to achieve a particular race time for a period of
        training to be successful.
      </p>
      <Button variant="primary" onClick={onStart}>
        Get started
      </Button>
    </div>
  );
}
