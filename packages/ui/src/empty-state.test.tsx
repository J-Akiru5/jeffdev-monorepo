import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./empty-state";
import { FileQuestion } from "lucide-react";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        title="No results found"
        description="Try adjusting your search or filters."
      />,
    );
    expect(screen.getByText("No results found")).toBeDefined();
    expect(screen.getByText("Try adjusting your search or filters.")).toBeDefined();
  });

  it("renders with an icon", () => {
    render(
      <EmptyState
        icon={FileQuestion}
        title="Nothing here"
        description="No data available."
      />,
    );
    expect(screen.getByText("Nothing here")).toBeDefined();
  });

  it("renders action content when action prop is provided", () => {
    render(
      <EmptyState
        title="No items"
        description="Create your first item."
        action={<button>Create Item</button>}
      />,
    );
    expect(screen.getByText("Create Item")).toBeDefined();
  });

  it("does not render action content when action prop is not provided", () => {
    render(
      <EmptyState
        title="No items"
        description="No data available."
      />,
    );
    // Only title and description should be present
    expect(screen.getByText("No items")).toBeDefined();
    expect(screen.getByText("No data available.")).toBeDefined();
    // No button-like elements from action
    expect(screen.queryByRole("button")).toBeNull();
  });
});
