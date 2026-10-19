"use client";

/**
 * Page Blocks (arc 3 · D6)
 * ------------------------
 * Block-based editor for pages: text, heading, bullet, checklist, code,
 * divider. Controlled component — the page editor owns the block array and
 * the autosave. Stored content stays compatible with legacy `{type,text}`
 * blocks (see normalizeBlocks).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckSquare,
  Code,
  Heading2,
  List,
  Minus,
  Plus,
  Trash2,
  Type,
} from "lucide-react";

export type BlockType =
  | "text"
  | "heading"
  | "bullet"
  | "checklist"
  | "code"
  | "divider";

export interface Block {
  id: string;
  type: BlockType;
  text: string;
  checked?: boolean;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: typeof Type }[] = [
  { type: "text", label: "Text", icon: Type },
  { type: "heading", label: "Heading", icon: Heading2 },
  { type: "bullet", label: "Bullet list", icon: List },
  { type: "checklist", label: "Checklist", icon: CheckSquare },
  { type: "code", label: "Code", icon: Code },
  { type: "divider", label: "Divider", icon: Minus },
];

let blockSeq = 0;
function newBlockId(): string {
  blockSeq += 1;
  return `b-${Date.now().toString(36)}-${blockSeq}`;
}

/** Maps stored page content (legacy or current) to editor blocks. */
export function normalizeBlocks(
  raw: Record<string, unknown>[] | null | undefined,
): Block[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set<string>(BLOCK_TYPES.map((t) => t.type));
  return raw.map((b, i) => {
    const rawType = typeof b.type === "string" ? b.type : "text";
    return {
      id: typeof b.id === "string" && b.id ? b.id : `legacy-${i}`,
      type: (known.has(rawType) ? rawType : "text") as BlockType,
      text: typeof b.text === "string" ? b.text : "",
      checked: b.checked === true,
    };
  });
}

/** Strips editor-only fields before persisting. */
export function serializeBlocks(blocks: Block[]): Record<string, unknown>[] {
  return blocks.map((b) => ({
    id: b.id,
    type: b.type,
    text: b.text,
    ...(b.type === "checklist" ? { checked: b.checked === true } : {}),
  }));
}

function resizeTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

function BlockTextarea({
  value,
  onInput,
  onEnter,
  onBackspaceEmpty,
  registerRef,
  ariaLabel,
  placeholder,
  className,
}: {
  value: string;
  onInput: (text: string) => void;
  onEnter: () => void;
  onBackspaceEmpty: () => void;
  registerRef: (el: HTMLTextAreaElement | null) => void;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
}) {
  const localRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    resizeTextarea(localRef.current);
  }, [value]);

  return (
    <textarea
      ref={(el) => {
        localRef.current = el;
        registerRef(el);
      }}
      value={value}
      rows={1}
      aria-label={ariaLabel}
      onChange={(e) => {
        onInput(e.target.value);
        resizeTextarea(e.currentTarget);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onEnter();
        }
        if (e.key === "Backspace" && e.currentTarget.value === "") {
          e.preventDefault();
          onBackspaceEmpty();
        }
      }}
      placeholder={placeholder}
      className={`w-full resize-none overflow-hidden bg-transparent outline-none placeholder-white/20 ${className ?? ""}`}
    />
  );
}

export function PageBlocks({
  blocks,
  onChange,
}: {
  blocks: Block[];
  onChange: (next: Block[]) => void;
}) {
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const refs = useRef(new Map<string, HTMLTextAreaElement>());

  // Focus a block after structural changes (add / type change / delete)
  useEffect(() => {
    if (!focusId) return;
    const el = refs.current.get(focusId);
    if (el) {
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
    setFocusId(null);
  }, [focusId, blocks]);

  const updateBlock = useCallback(
    (id: string, patch: Partial<Block>) => {
      onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    },
    [blocks, onChange],
  );

  const addBlock = useCallback(
    (type: BlockType, afterId?: string) => {
      const block: Block = {
        id: newBlockId(),
        type,
        text: "",
        ...(type === "checklist" ? { checked: false } : {}),
      };
      const idx = afterId
        ? blocks.findIndex((b) => b.id === afterId)
        : blocks.length - 1;
      const next = [...blocks];
      next.splice(idx + 1, 0, block);
      onChange(next);
      if (type !== "divider") setFocusId(block.id);
    },
    [blocks, onChange],
  );

  const removeBlock = useCallback(
    (id: string) => {
      const idx = blocks.findIndex((b) => b.id === id);
      const next = blocks.filter((b) => b.id !== id);
      onChange(next);
      const prev = next[idx - 1];
      if (prev && prev.type !== "divider") setFocusId(prev.id);
    },
    [blocks, onChange],
  );

  const moveBlock = useCallback(
    (id: string, dir: -1 | 1) => {
      const idx = blocks.findIndex((b) => b.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= blocks.length) return;
      const next = [...blocks];
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved!);
      onChange(next);
    },
    [blocks, onChange],
  );

  const changeType = useCallback(
    (id: string, type: BlockType) => {
      updateBlock(id, {
        type,
        ...(type === "checklist" ? { checked: false } : {}),
      });
      setMenuFor(null);
      if (type !== "divider") setFocusId(id);
    },
    [updateBlock],
  );

  const registerRef = useCallback(
    (id: string) => (el: HTMLTextAreaElement | null) => {
      if (el) refs.current.set(id, el);
      else refs.current.delete(id);
    },
    [],
  );

  return (
    <div className="space-y-0.5">
      {blocks.map((b) => {
        const typeDef =
          BLOCK_TYPES.find((t) => t.type === b.type) ?? BLOCK_TYPES[0]!;
        const Icon = typeDef.icon;
        return (
          <div
            key={b.id}
            className="group relative flex items-start gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-white/[0.02]"
          >
            <button
              onClick={() => setMenuFor(menuFor === b.id ? null : b.id)}
              aria-label={`Change block type (${typeDef.label})`}
              aria-haspopup="menu"
              className="mt-1 rounded p-1 text-white/25 opacity-0 transition-opacity hover:text-white/70 focus-visible:opacity-100 group-hover:opacity-100"
            >
              <Icon className="h-3.5 w-3.5" />
            </button>

            {menuFor === b.id && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setMenuFor(null)}
                  aria-hidden="true"
                />
                <div className="absolute top-8 left-8 z-40 w-44 rounded-lg border border-border bg-[#11151C] p-1 shadow-xl">
                  {BLOCK_TYPES.map((t) => (
                    <button
                      key={t.type}
                      onClick={() => changeType(b.id, t.type)}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      <t.icon className="h-3.5 w-3.5 text-white/40" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="min-w-0 flex-1 py-0.5">
              {b.type === "divider" ? (
                <div className="py-2">
                  <hr className="border-border" />
                </div>
              ) : b.type === "checklist" ? (
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={b.checked === true}
                    onChange={(e) =>
                      updateBlock(b.id, { checked: e.target.checked })
                    }
                    aria-label={b.text || "Checklist item"}
                    className="mt-1.5 h-4 w-4 shrink-0 rounded border-border accent-cyan-500"
                  />
                  <BlockTextarea
                    value={b.text}
                    onInput={(text) => updateBlock(b.id, { text })}
                    onEnter={() => addBlock("checklist", b.id)}
                    onBackspaceEmpty={() => removeBlock(b.id)}
                    registerRef={registerRef(b.id)}
                    ariaLabel="Checklist item text"
                    placeholder="To-do"
                    className={
                      b.checked
                        ? "text-base text-white/40 line-through"
                        : "text-base text-white/80"
                    }
                  />
                </div>
              ) : b.type === "bullet" ? (
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 select-none text-white/40">•</span>
                  <BlockTextarea
                    value={b.text}
                    onInput={(text) => updateBlock(b.id, { text })}
                    onEnter={() => addBlock("bullet", b.id)}
                    onBackspaceEmpty={() => removeBlock(b.id)}
                    registerRef={registerRef(b.id)}
                    ariaLabel="Bullet item"
                    placeholder="List item"
                    className="text-base text-white/80"
                  />
                </div>
              ) : b.type === "heading" ? (
                <BlockTextarea
                  value={b.text}
                  onInput={(text) => updateBlock(b.id, { text })}
                  onEnter={() => addBlock("text", b.id)}
                  onBackspaceEmpty={() => removeBlock(b.id)}
                  registerRef={registerRef(b.id)}
                  ariaLabel="Heading"
                  placeholder="Heading"
                  className="text-xl font-semibold text-white"
                />
              ) : b.type === "code" ? (
                <div className="rounded-lg border border-border bg-[#11151C] px-3 py-2">
                  <BlockTextarea
                    value={b.text}
                    onInput={(text) => updateBlock(b.id, { text })}
                    onEnter={() => addBlock("code", b.id)}
                    onBackspaceEmpty={() => removeBlock(b.id)}
                    registerRef={registerRef(b.id)}
                    ariaLabel="Code"
                    placeholder="Code"
                    className="font-mono text-sm text-cyan-100/80"
                  />
                </div>
              ) : (
                <BlockTextarea
                  value={b.text}
                  onInput={(text) => updateBlock(b.id, { text })}
                  onEnter={() => addBlock("text", b.id)}
                  onBackspaceEmpty={() => removeBlock(b.id)}
                  registerRef={registerRef(b.id)}
                  ariaLabel="Text block"
                  placeholder="Type something…"
                  className="text-base leading-relaxed text-white/80"
                />
              )}
            </div>

            <div className="mt-1 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
              <button
                aria-label="Move block up"
                onClick={() => moveBlock(b.id, -1)}
                className="rounded p-1 text-white/25 transition-colors hover:text-white/70"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                aria-label="Move block down"
                onClick={() => moveBlock(b.id, 1)}
                className="rounded p-1 text-white/25 transition-colors hover:text-white/70"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                aria-label="Delete block"
                onClick={() => removeBlock(b.id)}
                className="rounded p-1 text-white/25 transition-colors hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}

      <button
        onClick={() => addBlock("text")}
        className="mt-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/30 transition-colors hover:text-white/60"
      >
        <Plus className="h-4 w-4" />
        Add block
      </button>
    </div>
  );
}
