# Mobile & Python — structural rule sets (Phase 4)

Real-convention starter packs for stacks outside the web token world.
These use ONLY the language-agnostic **structural** check family
(`naming_pattern`, `file_placement`, `forbidden_pattern`, `required_import`)
— no design-token extraction exists for these stacks by design (Dart/Swift/
Kotlin define tokens in code, which is a different problem we are not
solving yet).

## Files

| File                 | Stack            | Highlights                                                                                                                           |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `flutter-rules.json` | Flutter / Dart   | PascalCase widgets in `lib/widgets/`, no `print()` (use debugPrint), widget files import Material, snake_case Dart names elsewhere   |
| `kotlin-rules.json`  | Kotlin / Compose | No `!!` assertions, `GlobalScope` banned (block severity), composables in `ui/components/`, `*Screen.kt` must import compose runtime |
| `python-rules.json`  | Python           | snake_case modules (PEP 8), tests in `tests/` importing pytest, no bare `except:`, no committed debuggers                            |

## Usage

```bash
# Lint a repo against a pack
npx @prism-engine/cli check --rules path/to/flutter-rules.json lib/

# Or merge rules into your project's .prism/rules.json and let the Pass
# enforce on every agent write (Claude Code / Cursor / Antigravity).
```

## Severity model

Exact-match checks (`required_import` with includePattern, `file_placement`)
are safe to hand-promote to `"severity": "block"`. Judgment calls
(`naming_pattern` heuristics, lint-mirroring `forbidden_pattern`) ship as
`"warn"` deliberately.

## What is NOT here (deliberate)

Token/theme extraction for Flutter, SwiftUI, or Jetpack Compose — those
define tokens in Dart/Swift/Kotlin code rather than CSS. Different problem,
no user signal asking for it yet.
