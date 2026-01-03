#!/usr/bin/env bash
set -euo pipefail

echo "This script sets up local dev dependencies and provides quick instructions."

echo "Install generator deps:"
(cd generator && npm ci)

echo "Install frontend deps:"
(cd frontend && npm ci)

echo "Worker: install wrangler globally if needed"

echo "See README.md for full setup steps and environment variables."
