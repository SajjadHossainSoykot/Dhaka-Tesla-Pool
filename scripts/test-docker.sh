#!/usr/bin/env sh
set -eu
docker compose --profile test run --rm api-test
docker compose --profile test down -v
