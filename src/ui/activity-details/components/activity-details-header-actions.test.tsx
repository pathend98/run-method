import { fireEvent, render, screen } from "@testing-library/react";

import { ActivityDetailsHeaderActions } from "./activity-details-header-actions";

function renderHeaderActions(canSkip = true) {
  const onClose = vi.fn();
  const onDelete = vi.fn();
  const onEdit = vi.fn();
  const onSkip = vi.fn();
  render(
    <ActivityDetailsHeaderActions
      canSkip={canSkip}
      disabled={false}
      onClose={onClose}
      onDelete={onDelete}
      onEdit={onEdit}
      onSkip={onSkip}
    />,
  );
  return { onClose, onDelete, onEdit, onSkip };
}

test("shows the eligible actions and dispatches them from the header", () => {
  const actions = renderHeaderActions();

  fireEvent.click(screen.getByRole("button", { name: "Edit activity" }));
  fireEvent.click(
    screen.getByRole("button", { name: "More activity actions" }),
  );
  fireEvent.click(screen.getByRole("menuitem", { name: "Skip activity" }));
  fireEvent.click(
    screen.getByRole("button", { name: "More activity actions" }),
  );
  fireEvent.click(
    screen.getByRole("menuitem", { name: "Delete activity" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Close activity details" }),
  );

  expect(actions.onEdit).toHaveBeenCalledOnce();
  expect(actions.onSkip).toHaveBeenCalledOnce();
  expect(actions.onDelete).toHaveBeenCalledOnce();
  expect(actions.onClose).toHaveBeenCalledOnce();
});

test("omits skip and closes the menu with Escape", () => {
  renderHeaderActions(false);
  const trigger = screen.getByRole("button", {
    name: "More activity actions",
  });

  fireEvent.click(trigger);
  expect(screen.queryByRole("menuitem", { name: "Skip activity" })).toBeNull();
  fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });

  expect(screen.queryByRole("menu")).toBeNull();
  expect(document.activeElement).toBe(trigger);
});
