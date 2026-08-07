---
title: AdGen Workspace
description: A new AI workspace for turning advertising ideas into structured, repeatable creative workflows.
publishDate: 2026-08-06
category: ai
order: 1
tags: [AI, Automation, Creative tooling]
img: /img/adgen-excalidraw.png
img_alt: AdGen workspace interface flowing into a finished advertising creative.
---

## A workspace for AI-assisted advertising

AdGen Workspace is a new project exploring how AI can support the full creative loop: moving from an initial idea to generated material, review and iteration inside one coherent workspace.

The project is currently in development. More detail, working examples and design decisions will be added here as the system takes shape.

<figure class="diagram">
  <img src="/img/adgen-excalidraw.png" alt="AdGen workspace interface flowing into a finished advertising creative." loading="lazy" decoding="async" />
  <figcaption>The workspace turns structured campaign exploration into finished creative.</figcaption>
</figure>

## Current focus

- Structured workflows rather than isolated prompts
- Human review at meaningful decision points
- Reusable context across creative iterations
- Clear provenance for generated outputs

## Multi-agent architecture

<figure class="diagram">
  <img src="/img/adgen-agent-architecture.svg" alt="AdGen multi-agent architecture connecting campaign, image and headline agents to human review, the Meta Marketing API and an evolution orchestrator." loading="lazy" decoding="async" />
  <figcaption>Performance signals from Meta drive the next creative batch, with human review throughout.</figcaption>
</figure>
