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
  const overlay = dialog.parentElement;
  const content = within(dialog).getByText("Modal content").parentElement;
  const header =
    within(dialog).getByRole("heading").parentElement?.parentElement;
  expect(overlay?.classList).toContain("p-0");
  expect(overlay?.classList).toContain("sm:p-6");
  expect(dialog.classList).toContain("fixed");
  expect(dialog.classList).toContain("inset-0");
  expect(dialog.classList).toContain("h-dvh");
  expect(dialog.classList).toContain("w-full");
  expect(dialog.classList).toContain("max-w-none");
  expect(dialog.classList).toContain("rounded-none");
  expect(dialog.classList).toContain("overflow-y-auto");
  expect(dialog.classList).toContain("sm:relative");
  expect(dialog.classList).toContain("sm:inset-auto");
  expect(dialog.classList).toContain("sm:h-auto");
  expect(dialog.classList).toContain("sm:max-w-xl");
  expect(dialog.classList).toContain("sm:rounded-xl");
  expect(header?.classList).toContain("sticky");
  expect(header?.classList).toContain("top-0");
  expect(header?.classList).toContain("sm:static");
  expect(content?.classList).toContain("flex-1");
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
  const onPrimaryAction = vi.fn();
  const onSecondaryAction = vi.fn();
  const onClose = vi.fn();
  const onDelete = vi.fn();
  const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
  render(
    <Modal
      dismissLabel="Dismiss actions"
      closeLabel="Close actions"
      eyebrow="Training session · Today"
      footerActions={[
        {
          disabled: true,
          label: "Delete",
          onClick: onDelete,
          variant: "destructive",
        },
        {
          label: "Remove",
          onClick: onDelete,
          variant: "destructive",
        },
        {
          form: "example-form",
          label: "Save",
          type: "submit",
          variant: "primary",
        },
      ]}
      primaryHeaderActions={[
        { label: "Open", onClick: onPrimaryAction, variant: "primary" },
        { label: "Preview", onClick: onPrimaryAction, variant: "secondary" },
      ]}
      secondaryHeaderActions={[
        {
          label: "Archive",
          onClick: onSecondaryAction,
          variant: "secondary",
        },
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
  expect(dialog.classList.contains("sm:max-w-4xl")).toBe(true);
  expect(within(dialog).getByText("Training session · Today")).toBeDefined();
  const title = within(dialog).getByRole("heading", { name: "Actions" });
  const subtitle = within(dialog).getByText("Run · Scheduled · Morning");
  expect(title.compareDocumentPosition(subtitle)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  expect(
    screen.getByRole("button", { name: "Open" }).parentElement?.classList,
  ).toContain("sm:block");
  fireEvent.click(screen.getByRole("button", { name: "More actions" }));
  const secondaryMenu = screen.getByRole("menu");
  expect(secondaryMenu.classList.contains("flex")).toBe(true);
  expect(secondaryMenu.classList.contains("flex-col")).toBe(true);
  expect(secondaryMenu.classList.contains("gap-2")).toBe(true);
  const mobilePrimaryAction = screen.getByRole("menuitem", { name: "Open" });
  expect(mobilePrimaryAction.parentElement?.classList).toContain("sm:hidden");
  fireEvent.click(mobilePrimaryAction);
  expect(screen.queryByRole("menu")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "More actions" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Archive" }));
  fireEvent.click(screen.getByRole("button", { name: "Close actions" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove" }));
  fireEvent.click(screen.getByRole("button", { name: "Save" }));

  expect(onPrimaryAction).toHaveBeenCalledOnce();
  expect(onSecondaryAction).toHaveBeenCalledOnce();
  expect(onClose).toHaveBeenCalledOnce();
  expect(onDelete).toHaveBeenCalledOnce();
  expect(screen.getByRole("button", { name: "Delete" })).toHaveProperty(
    "disabled",
    true,
  );
  expect(onSubmit).toHaveBeenCalledOnce();

  const footer = screen.getByRole("button", { name: "Save" }).parentElement;
  expect(footer?.classList).toContain("sticky");
  expect(footer?.classList).toContain("bottom-0");
  expect(footer?.classList).toContain("sm:static");
  expect(title.compareDocumentPosition(footer as Node)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
});

test("keeps header controls on one row beside a long wrapping title", () => {
  render(
    <Modal
      dismissLabel="Dismiss long title"
      onClose={vi.fn()}
      secondaryHeaderActions={[
        { label: "Archive", onClick: vi.fn(), variant: "secondary" },
      ]}
      title="Averylongtrainingsessiontitlethatmustwrapwithoutmovingtheheadercontrols"
    >
      <p>Modal content</p>
    </Modal>,
  );

  const title = screen.getByRole("heading", {
    name: "Averylongtrainingsessiontitlethatmustwrapwithoutmovingtheheadercontrols",
  });
  const titleRegion = title.parentElement;
  const header = titleRegion?.parentElement;
  const controls = screen.getByRole("button", {
    name: "Close modal",
  }).parentElement;

  expect(header?.classList).toContain("grid");
  expect(header?.classList).toContain("grid-cols-[minmax(0,1fr)_auto]");
  expect(titleRegion?.classList).toContain("min-w-0");
  expect(title.classList).toContain("break-words");
  expect(controls?.classList).toContain("shrink-0");
  expect(controls?.classList).toContain("flex-nowrap");
  expect(
    within(controls as HTMLElement).getByRole("button", {
      name: "More actions",
    }),
  ).toBeDefined();
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
