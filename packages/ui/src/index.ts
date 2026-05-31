/**
 * @syntaxure/ui
 * Syntaxure Labs Component Library
 *
 * Ghost Glow aesthetic • Headless logic • Tailwind styling
 *
 * @example
 * import { Button, Card, Input, Badge } from "@syntaxure/ui";
 */

// Utilities
export { cn } from "./utils";

// Components
export { Button, buttonVariants, type ButtonProps } from "./button";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
  type CardProps,
} from "./card";
export { Input, inputVariants, type InputProps } from "./input";
export { Badge, badgeVariants, type BadgeProps } from "./badge";
export { ProgressBar } from "./progress-bar";
export { DataTable } from "./data-table";
export { MetricTile, type MetricTileProps } from "./metric-tile";
export { GridBackground } from "./grid-background";
export { SectionHeader } from "./section-header";
export { GlassPanel } from "./glass-panel";
export { SyntaxureLogo } from "./logo";
export { Select, type SelectOption, type SelectProps } from "./select";
export { AccountDropdown, type AccountDropdownProps } from "./account-dropdown";
export { AppTopNavbar, type AppNavLink, type AppTopNavbarProps } from "./app-top-navbar";
export { RealtimeClock } from "./realtime-clock";
export { ThemeDefaultSync } from "./theme-default-sync";
export { ProfileEditor, type ProfileEditorProps, type ProfileEditorData } from "./profile-editor";
export { AuthProvider, useAuth, type AuthProfile, type AuthContextValue } from "./auth-provider";
export {
  Skeleton,
  SkeletonTable,
  SkeletonBackLink,
  SkeletonPageHeader,
  SkeletonStatsGrid,
  SkeletonCard,
} from "./skeleton";
export { EmptyState } from "./empty-state";
export { ConfirmDialog } from "./confirm-dialog";
export { ErrorBoundary } from "./error-boundary";
export { ImageUpload, type ImageUploadProps } from "./image-upload";
export {
  FeatureFlagProvider,
  useFeatureFlag,
  useFeatureFlags,
  type FeatureFlags,
} from "./feature-flags";

// Hooks
export { useDebouncedValue } from "./use-debounced-value";
export { useActionFeedback, type ActionState } from "./use-action-feedback";
export { PageContainer, type PageContainerProps } from "./page-container";

// Keyboard Shortcuts
export {
  KeyboardShortcutsProvider,
} from "./keyboard-shortcuts-provider";
export {
  CommandPalette,
  type CommandPaletteProps,
  type CommandPaletteSection,
  type CommandPaletteItem,
} from "./command-palette";
export {
  KeyboardShortcutsHelp,
  type KeyboardShortcutsHelpProps,
  type ShortcutsHelpShortcut,
} from "./keyboard-shortcuts-help";
export {
  getShortcutLabel,
  matchesShortcut,
  SHORTCUT_SEARCH,
  SHORTCUT_SIDEBAR,
  SHORTCUT_COMMAND_PALETTE,
  SHORTCUT_HELP,
  SHORTCUT_TOGGLE_MODE,
  type KeyboardShortcutDef,
} from "./keyboard-shortcuts";

