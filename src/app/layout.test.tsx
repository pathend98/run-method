import { isValidElement } from "react";
import RootLayout, { metadata } from "./layout";
import { Navbar } from "@/ui/navbar/navbar";
import { QueryProvider } from "./query-provider";

test("exports the application metadata", () => {
  expect(metadata).toEqual({
    title: "Run Method",
    description: "Run coaching and training planning.",
  });
});

test("renders the root html and body structure", () => {
  const child = <main>Planner</main>;
  const root = RootLayout({ children: child });

  expect(isValidElement(root)).toBe(true);
  expect(root.type).toBe("html");
  expect(root.props).toMatchObject({
    lang: "en",
    suppressHydrationWarning: true,
  });

  const body = root.props.children;
  expect(isValidElement(body)).toBe(true);
  expect(body.type).toBe("body");
  expect(body.props.suppressHydrationWarning).toBe(true);
  const provider = body.props.children;
  expect(provider.type).toBe(QueryProvider);
  expect(provider.props.children[0].type).toBe(Navbar);
  expect(provider.props.children[1]).toBe(child);
});
