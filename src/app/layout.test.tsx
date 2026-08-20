import { isValidElement } from "react";
import RootLayout, { metadata } from "./layout";

test("exports the application metadata", () => {
  expect(metadata).toEqual({
    title: "Training Brain",
    description: "Run coaching and training planning.",
  });
});

test("renders the root html and body structure", () => {
  const child = <main>Planner</main>;
  const root = RootLayout({ children: child });

  expect(isValidElement(root)).toBe(true);
  expect(root.type).toBe("html");
  expect(root.props).toMatchObject({ lang: "en" });

  const body = root.props.children;
  expect(isValidElement(body)).toBe(true);
  expect(body.type).toBe("body");
  expect(body.props.children).toBe(child);
});
