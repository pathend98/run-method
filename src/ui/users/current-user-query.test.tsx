import { render, screen } from "@testing-library/react";

import { QueryProvider } from "@/app/query-provider";
import { useCurrentUserQuery } from "./current-user-query";

function CurrentUserId() {
  const query = useCurrentUserQuery();
  return <span>{query.data?.id}</span>;
}

test("current-user query shares one request across consumers", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({
      id: "user-id",
      kind: "REGISTERED",
      expiresAt: null,
    }),
  });
  vi.stubGlobal("fetch", fetchMock);

  render(
    <QueryProvider>
      <CurrentUserId />
      <CurrentUserId />
    </QueryProvider>,
  );

  expect(await screen.findAllByText("user-id")).toHaveLength(2);
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/v1/me", {
    cache: "no-store",
  });
});
