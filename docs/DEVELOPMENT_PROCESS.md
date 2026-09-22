# Development Process and AI-Assisted Workflow

## Why the early commit timeline is compressed

The first MVP implementation was completed in a concentrated AI-assisted engineering session. ChatGPT was used as a coding and review assistant to accelerate scaffolding, implementation, test design, and documentation. The short elapsed time between the earliest commits therefore reflects tool-assisted development rather than an attempt to represent each commit as several minutes or hours of manual typing.

The repository still keeps logical feature branches and commits because they document architectural boundaries and make individual changes reviewable: architecture/data model, authentication, pooling, driver flow, frontend, testing/Docker, and release hardening.

## Human ownership before submission

AI assistance does not replace ownership. Before submission, the project should be verified manually by the candidate through the following steps:

1. Run the project from a clean local checkout with Docker Compose.
2. Read and explain the Prisma schema, fare policy, zone matching, lifecycle rules, and service layer.
3. Walk through the Nusrat/Rafiq/Jashim demo end to end.
4. Run the risk-focused tests, including the concurrent final-seat case.
5. Inspect failures and make any environment-specific fixes as normal commits.
6. Deploy the frontend, API, and database and smoke-test the deployed flow.
7. Add real screenshots and the final walkthrough-video link.
8. Be able to change or debug the implementation during an interview without relying on generated explanations.

## How to describe the workflow

A concise and accurate explanation is:

> I used ChatGPT as an AI engineering assistant to accelerate the first implementation of the MVP. I kept the work separated into logical branches and commits so the architecture and changes remained reviewable. I then treated the generated implementation like code I had inherited: I ran it locally, reviewed the schema and business rules, tested the important failure cases, fixed issues I found, deployed it, and made sure I could explain and modify the system myself.

## What the Git history means

The commit history is intended to show logical engineering stages, not to claim that every commit corresponds to a long period of manual coding. Commit timestamps are left as their actual timestamps rather than being backdated or artificially spaced.
