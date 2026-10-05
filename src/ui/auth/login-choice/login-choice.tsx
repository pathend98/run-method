import { Button } from "@/ui/shared/button/button";

export function LoginChoice() {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-950">
        Welcome to Run Method
      </h1>
      <form action="/auth" method="get" className="flex flex-col gap-3">
        <Button type="submit" variant="primary">
          Continue to login / signup
        </Button>
        <Button
          type="submit"
          formAction="/auth/guest"
          formMethod="get"
          variant="secondary"
        >
          Continue as guest
        </Button>
      </form>
    </section>
  );
}
