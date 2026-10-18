import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { Button } from "./button";

describe("Button Component (Design Constitution)", () => {
  it("renders with default props and precision geometry", () => {
    render(<Button>Deploy Engine</Button>);
    const button = screen.getByRole("button", { name: /deploy engine/i });
    expect(button).toBeDefined();
    expect(button.className).toContain("rounded-md");
    expect(button.className).toContain("active:scale-95");
  });

  it("renders with holographic variant adhering to visual constitution", () => {
    render(<Button variant="holographic">Execute_</Button>);
    const button = screen.getByRole("button", { name: /execute_/i });
    expect(button).toBeDefined();
    expect(button.className).toContain("border-white/10");
    expect(button.className).toContain("backdrop-blur-md");
  });

  it("supports all variants", () => {
    const { rerender } = render(<Button variant="primary">Action</Button>);
    expect(screen.getByRole("button").className).toContain("bg-blue-600");

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole("button")).toBeDefined();

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole("button").className).toContain("bg-transparent");

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button")).toBeDefined();

    rerender(<Button variant="cyan">Cyan Accent</Button>);
    expect(screen.getByRole("button").className).toContain("text-cyan-600");

    rerender(<Button variant="emerald">Emerald Status</Button>);
    expect(screen.getByRole("button").className).toContain("text-emerald-600");

    rerender(<Button variant="danger">Danger Action</Button>);
    expect(screen.getByRole("button").className).toContain("text-red-600");
  });

  it("supports all size options", () => {
    const { rerender } = render(<Button size="xs">XS Button</Button>);
    expect(screen.getByRole("button").className).toContain("h-7");

    rerender(<Button size="sm">SM Button</Button>);
    expect(screen.getByRole("button").className).toContain("h-8");

    rerender(<Button size="md">MD Button</Button>);
    expect(screen.getByRole("button").className).toContain("h-10");

    rerender(<Button size="lg">LG Button</Button>);
    expect(screen.getByRole("button").className).toContain("h-12");

    rerender(<Button size="icon" aria-label="Icon Button">+</Button>);
    expect(screen.getByRole("button").className).toContain("w-10");
  });

  it("renders loading state with spinner and disables button", () => {
    render(<Button isLoading loadingText="Deploying...">Deploy</Button>);
    const button = screen.getByRole("button") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByText("Deploying...")).toBeDefined();
  });

  it("renders leftIcon and rightIcon properly", () => {
    render(
      <Button
        leftIcon={<span data-testid="left-icon">⚡</span>}
        rightIcon={<span data-testid="right-icon">→</span>}
      >
        Launch
      </Button>,
    );
    expect(screen.getByTestId("left-icon")).toBeDefined();
    expect(screen.getByText("Launch")).toBeDefined();
    expect(screen.getByTestId("right-icon")).toBeDefined();
  });

  it("supports asChild polymorphic rendering", () => {
    render(
      <Button asChild>
        <a href="/dashboard">Go to Dashboard</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: /go to dashboard/i });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/dashboard");
    expect(link.className).toContain("rounded-md");
  });

  it("handles click events when enabled and ignores when disabled", () => {
    const handleClick = vi.fn();

    const { rerender } = render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);

    rerender(<Button disabled onClick={handleClick}>Disabled</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
