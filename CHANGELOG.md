# Changelog

All notable changes to the Prism Engine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Team Sync feature for shared rules across developers
- VS Code native MCP integration
- Rule import from `.cursorrules` files

---

## [0.1.0] - 2026-01-01

### 🎉 The Genesis Release

**Milestone**: Prism MCP Server successfully connected to Azure Cosmos DB.
Cursor can now query architectural rules directly from the database.

### Added

#### MCP Server (`apps/prism-mcp-server`)
- `get_architectural_rules` tool - Fetch rules by category/tag
- `validate_code_pattern` tool - Check code for violations  
- Resources: `prism://rules/all`, `prism://rules/architecture`
- StdioServerTransport for editor integration

#### Database (`packages/db`)
- Firebase Admin singleton for Agency app
- MongoDB client for Azure Cosmos DB
- Zod schemas: User, Rule, RuleSet, Project, Invoice
- Genesis seed script with 6 core rules

#### Documentation (`apps/prism-docs`)
- 11 documentation pages with Nextra 4
- Getting Started guide
- Rules creation guide
- Editor Setup (Cursor, VS Code/Cline, CLI agents)
- API Reference (MCP Server, Database)

#### UI Library (`@jdstudio/ui`)
- Ghost Glow Button (5 variants)
- Glass Panel Card (4 variants + subcomponents)
- Input (3 variants with label/error)
- Badge (8 variants including semantic + category)
- ProgressBar (extracted from Agency)
- DataTable (TanStack Table integration)

#### Prism Dashboard (`apps/prism-dashboard`)
- Scaffolded with Next.js 16
- Clerk authentication configured
- Landing page with JeffDev aesthetic
- Protected dashboard route

### Core Rules Seeded
1. Visual Constitution (styling)
2. Tech Stack Protocol (architecture)
3. Monorepo Geography (architecture)
4. Security Guard (security)
5. No Cross-App Imports (architecture)
6. Zod Validation Gate (security)

---

## Version History

| Version | Date | Highlight |
|---------|------|-----------|
| 0.1.0 | 2026-01-01 | 🌱 Genesis - MCP Server + DB Connected |
