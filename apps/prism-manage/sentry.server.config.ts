import * as Sentry from "@sentry/nextjs";
import { createSentryConfig } from "@syntaxure/sentry-config";

Sentry.init(createSentryConfig("prism-manage", { tracesSampleRate: 0.25 }));
