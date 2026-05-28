import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "./confirm-dialog";

describe("ConfirmDialog", () => {
  it("renders when open is true", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Delete item"
        description="Are you sure you want to delete this?"
        onConfirm={() => {}}
      />,
    );
    expect(screen.getByText("Delete item")).toBeDefined();
    expect(
      screen.getByText("Are you sure you want to delete this?"),
    ).toBeDefined();
  });

  it("does not render when open is false", () => {
    render(
      <ConfirmDialog
        open={false}
        onOpenChange={() => {}}
        title="Delete item"
        description="Are you sure?"
        onConfirm={() => {}}
      />,
    );
    expect(screen.queryByText("Delete item")).toBeNull();
  });

  it("calls onConfirm when confirm button is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Delete"
        description="Are you sure?"
        confirmLabel="Confirm Delete"
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByText("Confirm Delete"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenChange(false) when cancel is clicked", () => {
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Delete"
        description="Are you sure?"
        onConfirm={() => {}}
      />,
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders with custom confirm label", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Save"
        description="Save changes?"
        confirmLabel="Save Changes"
        onConfirm={() => {}}
      />,
    );
    expect(screen.getByText("Save Changes")).toBeDefined();
  });

  it("shows destructive confirm variant", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Permanently delete?"
        description="This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => {}}
      />,
    );
    // The title should be different from the button label
    expect(screen.getByText("Permanently delete?")).toBeDefined();
    expect(screen.getByText("Delete")).toBeDefined();
  });
});
