import * as Sentry from "@sentry/nextjs";
import { createSentryConfig } from "@syntaxure/sentry-config";

Sentry.init(createSentryConfig("prism-engine", { tracesSampleRate: 0.25 }));
