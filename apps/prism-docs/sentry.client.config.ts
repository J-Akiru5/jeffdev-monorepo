import * as Sentry from "@sentry/nextjs";
import { createSentryConfig } from "@syntaxure/sentry-config";

Sentry.init(createSentryConfig("prism-docs", { tracesSampleRate: 0.1 }));
