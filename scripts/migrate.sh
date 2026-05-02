#!/bin/bash
# Load environment variables from .env and run drizzle migrations

set -a
source .env
set +a

echo "Running migrations..."
npx drizzle-kit migrate