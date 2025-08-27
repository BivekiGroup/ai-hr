#!/usr/bin/env bash
set -euo pipefail

echo "Preparing demo artifacts into ./dist ..."
mkdir -p dist
cp -r docs dist/docs
cp -r data/samples dist/samples
echo "Done."

