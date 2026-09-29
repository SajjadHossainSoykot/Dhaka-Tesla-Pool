# Final Submission Checklist

- [ ] Run the app locally from a clean clone with `docker compose up --build`.
- [ ] Run `docker compose --profile test run --rm api-test` and save the passing output.
- [ ] Run `./scripts/check-no-secrets.sh`.
- [ ] Confirm no `.env`, API key, database password, or token is committed.
- [ ] Generate/commit package lockfiles after dependency installation for tighter reproducibility.
- [ ] Capture 2-4 real screenshots/GIFs and add them under `docs/screenshots/`; embed them in README.
- [ ] Push all long-lived and feature branches, not only `main`.
- [ ] Deploy frontend/API/database using free tiers.
- [ ] Replace README placeholders for Repository / Live Demo / Video.
- [ ] Test demo accounts on the deployed environment.
- [ ] Record a maximum 6-minute video using `docs/VIDEO_SCRIPT.md`.
- [ ] Watch the full video once; verify architecture/ERD text is readable.
- [ ] Confirm the exact GitHub, live, and video URLs in the Google Form before submitting.
