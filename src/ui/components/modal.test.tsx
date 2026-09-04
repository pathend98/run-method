import { fireEvent, render, screen, within } from "@testing-library/react";
import type { FormEvent } from "react";

import { Modal } from "./modal";

test("renders an accessible medium dialog and handles dismissal", () => {
  const onClose = vi.fn();
  const { unmount } = render(
    <Modal
      dismissLabel="Dismiss example"
      onClose={onClose}
      title="Example modal"
    >
      <p>Modal content</p>
    </Modal>,
  );

  const dialog = screen.getByRole("dialog", { name: "Example modal" });
  expect(dialog.classList.contains("max-w-xl")).toBe(true);
  expect(within(dialog).getByText("Modal content")).toBeDefined();
  expect(
    within(dialog).getByRole("button", { name: "Close modal" }),
  ).toBeDefined();

  fireEvent.keyDown(window, { key: "Tab" });
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.keyDown(window, { key: "Escape" });
  fireEvent.click(screen.getByRole("button", { name: "Dismiss example" }));
  expect(onClose).toHaveBeenCalledTimes(2);

  unmount();
  fireEvent.keyDown(window, { key: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(2);
});

test("renders and wires primary, secondary, and footer actions", () => {
  const onOpen = vi.fn();
  const onClose = vi.fn();
  const onDelete = vi.fn();
  const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
  render(
    <Modal
      dismissLabel="Dismiss actions"
      closeLabel="Close actions"
      eyebrow="Activity · Today"
      footerActions={[
        {
          disabled: true,
          label: "Delete",
          onClick: onDelete,
          variant: "danger",
        },
        {
          label: "Remove",
          onClick: onDelete,
          variant: "danger-outline",
        },
        {
          form: "example-form",
          label: "Save",
          type: "submit",
          variant: "primary",
        },
      ]}
      primaryHeaderActions={[
        { label: "Open", onClick: onOpen, variant: "primary" },
        { label: "Preview", onClick: onOpen, variant: "secondary" },
      ]}
      secondaryHeaderActions={[
        { label: "Archive", onClick: onOpen, variant: "secondary" },
      ]}
      onClose={onClose}
      size="large"
      subtitle="Run · Scheduled · Morning"
      title="Actions"
    >
      <form id="example-form" onSubmit={onSubmit} />
    </Modal>,
  );

  const dialog = screen.getByRole("dialog", { name: "Actions" });
  expect(dialog.classList.contains("max-w-4xl")).toBe(true);
  expect(within(dialog).getByText("Activity · Today")).toBeDefined();
  const title = within(dialog).getByRole("heading", { name: "Actions" });
  const subtitle = within(dialog).getByText("Run · Scheduled · Morning");
  expect(title.compareDocumentPosition(subtitle)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  fireEvent.click(screen.getByRole("button", { name: "Open" }));
  fireEvent.click(screen.getByRole("button", { name: "More actions" }));
  const secondaryMenu = screen.getByRole("menu");
  expect(secondaryMenu.classList.contains("flex")).toBe(true);
  expect(secondaryMenu.classList.contains("flex-col")).toBe(true);
  expect(secondaryMenu.classList.contains("gap-2")).toBe(true);
  fireEvent.click(screen.getByRole("menuitem", { name: "Archive" }));
  fireEvent.click(screen.getByRole("button", { name: "Close actions" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove" }));
  fireEvent.click(screen.getByRole("button", { name: "Save" }));

  expect(onOpen).toHaveBeenCalledTimes(2);
  expect(onClose).toHaveBeenCalledOnce();
  expect(onDelete).toHaveBeenCalledOnce();
  expect(screen.getByRole("button", { name: "Delete" })).toHaveProperty(
    "disabled",
    true,
  );
  expect(onSubmit).toHaveBeenCalledOnce();
});

test("disables every action and dismissal route while busy", () => {
  const onClose = vi.fn();
  const onAction = vi.fn();
  render(
    <Modal
      dismissLabel="Dismiss busy modal"
      primaryHeaderActions={[
        { label: "Continue", onClick: onAction, variant: "primary" },
      ]}
      isBusy
      onClose={onClose}
      title="Busy modal"
    >
      <p>Working</p>
    </Modal>,
  );

  const dismissButton = screen.getByRole("button", {
    name: "Dismiss busy modal",
  });
  const actionButton = screen.getByRole("button", { name: "Continue" });
  const closeButton = screen.getByRole("button", { name: "Close modal" });
  expect(dismissButton).toHaveProperty("disabled", true);
  expect(actionButton).toHaveProperty("disabled", true);
  expect(closeButton).toHaveProperty("disabled", true);

  fireEvent.keyDown(window, { key: "Escape" });
  fireEvent.click(dismissButton);
  fireEvent.click(actionButton);
  fireEvent.click(closeButton);
  expect(onClose).not.toHaveBeenCalled();
  expect(onAction).not.toHaveBeenCalled();
});
