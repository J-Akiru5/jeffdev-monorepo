import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  Skeleton,
  SkeletonTable,
  SkeletonBackLink,
  SkeletonPageHeader,
  SkeletonStatsGrid,
  SkeletonCard,
} from "./skeleton";

describe("Skeleton", () => {
  it("renders default variant (generic)", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("animate-pulse");
    expect(el.className).toContain("rounded");
    expect(el.className).toContain("bg-white/5");
  });

  it("renders text variant with multiple lines", () => {
    const { container } = render(<Skeleton variant="text" />);
    const lines = container.firstChild?.childNodes;
    expect(lines?.length).toBe(3);
  });

  it("renders title variant", () => {
    const { container } = render(<Skeleton variant="title" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("animate-pulse");
    expect(el.className).toContain("w-48");
  });

  it("renders avatar variant as circle", () => {
    const { container } = render(<Skeleton variant="avatar" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("rounded-full");
    expect(el.className).toContain("h-10");
    expect(el.className).toContain("w-10");
  });

  it("renders card variant", () => {
    const { container } = render(<Skeleton variant="card" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("rounded-md");
  });

  it("renders table-row variant", () => {
    const { container } = render(<Skeleton variant="table-row" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("px-4");
    expect(el.className).toContain("py-3");
  });

  it("accepts custom className", () => {
    const { container } = render(<Skeleton className="custom-class" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("custom-class");
  });
});

describe("SkeletonBackLink", () => {
  it("renders a back-link skeleton", () => {
    const { container } = render(<SkeletonBackLink />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("h-4");
    expect(el.className).toContain("w-32");
  });

  it("accepts custom className", () => {
    const { container } = render(<SkeletonBackLink className="my-class" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("my-class");
  });
});

describe("SkeletonPageHeader", () => {
  it("renders title and subtitle with action button by default", () => {
    const { container } = render(<SkeletonPageHeader />);
    const wrapper = container.firstChild as HTMLElement;
    // justify-between indicates action layout
    expect(wrapper.className).toContain("justify-between");
    // Should have 3 skeleton children (title + subtitle + action)
    expect(wrapper.childNodes.length).toBe(2); // left div + right button
  });

  it("renders without action button when action=false", () => {
    const { container } = render(<SkeletonPageHeader action={false} />);
    const wrapper = container.firstChild as HTMLElement;
    // Should have 1 child (title + subtitle in a div)
    expect(wrapper.childNodes.length).toBe(1);
  });

  it("renders without subtitle when subtitle=false", () => {
    const { container } = render(<SkeletonPageHeader subtitle={false} action={false} />);
    const inner = container.firstChild?.firstChild as HTMLElement;
    // Should have 1 child (title only)
    expect(inner.childNodes.length).toBe(1);
  });

  it("accepts custom width props", () => {
    const { container } = render(
      <SkeletonPageHeader titleWidth="w-64" subtitleWidth="w-48" />,
    );
    const inner = container.firstChild?.firstChild as HTMLElement;
    const title = inner.firstChild as HTMLElement;
    expect(title.className).toContain("w-64");
  });
});

describe("SkeletonStatsGrid", () => {
  it("renders default 4 stat cards", () => {
    const { container } = render(<SkeletonStatsGrid />);
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain("grid");
    expect(grid.childNodes.length).toBe(4);
  });

  it("renders custom count", () => {
    const { container } = render(<SkeletonStatsGrid count={8} />);
    expect(container.firstChild?.childNodes.length).toBe(8);
  });

  it("applies cardClassName to each card", () => {
    const { container } = render(
      <SkeletonStatsGrid count={2} cardClassName="custom-card" />,
    );
    const cards = container.firstChild?.childNodes;
    expect((cards?.[0] as HTMLElement).className).toContain("custom-card");
    expect((cards?.[1] as HTMLElement).className).toContain("custom-card");
  });

  it("renders correct column class for cols=3", () => {
    const { container } = render(<SkeletonStatsGrid cols={3} />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("sm:grid-cols-3");
  });
});

describe("SkeletonCard", () => {
  it("renders with default props", () => {
    const { container } = render(<SkeletonCard />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("rounded-md");
    expect(card.className).toContain("border");
  });

  it("renders status badge when status=true", () => {
    const { container } = render(<SkeletonCard status />);
    const inner = container.firstChild?.firstChild as HTMLElement;
    // second child should be the status badge
    const statusBadge = inner.childNodes[1] as HTMLElement;
    expect(statusBadge.className).toContain("rounded-full");
  });

  it("hides status badge when status=false", () => {
    const { container } = render(<SkeletonCard status={false} />);
    const inner = container.firstChild?.firstChild as HTMLElement;
    // Only one child (title + description container)
    expect(inner.childNodes.length).toBe(1);
  });

  it("renders footer items", () => {
    const { container } = render(<SkeletonCard footerItems={3} />);
    const footer = container.firstChild?.childNodes[1] as HTMLElement;
    expect(footer.className).toContain("flex");
    expect(footer.childNodes.length).toBe(3);
  });

  it("hides footer when footerItems=0", () => {
    const { container } = render(<SkeletonCard footerItems={0} />);
    // Should only have 2 children: inner card body and no footer
    const children = container.firstChild?.childNodes;
    expect(children?.length).toBe(1); // just the inner body, no footer
  });

  it("renders multiple description lines", () => {
    const { container } = render(<SkeletonCard descriptionLines={3} status={false} footerItems={0} />);
    // container > flex-wrapper > flex-1 div > [title, line1, line2, line3]
    const body = container.firstChild?.firstChild?.firstChild as HTMLElement;
    // Title + 3 description lines = 4 children
    expect(body.childNodes.length).toBe(4);
  });

  it("accepts custom className", () => {
    const { container } = render(<SkeletonCard className="my-card" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("my-card");
  });
});

describe("SkeletonTable", () => {
  it("renders default 5 rows", () => {
    const { container } = render(<SkeletonTable />);
    // Header row + 5 body rows = 6 children in the container
    const children = container.firstChild?.childNodes;
    expect(children?.length).toBe(6); // 1 header + 5 rows
  });

  it("renders custom number of rows", () => {
    const { container } = render(<SkeletonTable rows={3} />);
    const children = container.firstChild?.childNodes;
    expect(children?.length).toBe(4); // 1 header + 3 rows
  });

  it("renders custom column count", () => {
    const { container } = render(<SkeletonTable rows={2} columns={5} />);
    const children = container.firstChild?.childNodes;
    // Each row should have 5 skeleton divs
    const firstRow = children?.[1]; // second child (first body row)
    expect(firstRow?.childNodes?.length).toBe(5);
  });
});
