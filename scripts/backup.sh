#!/bin/bash

# Vangarments Backup Script
# Usage: ./scripts/backup.sh [optional_message]

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PROJECT_ROOT="$DIR/.."

cd "$PROJECT_ROOT"

# Check for changes
if [[ -z $(git status -s) ]]; then
  echo "No changes to backup."
  exit 0
fi

# Add all changes
git add .

# Determine commit message
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
MSG="Backup: Auto-save at $TIMESTAMP"

if [ ! -z "$1" ]; then
  MSG="Backup: $1 ($TIMESTAMP)"
fi

# Commit
git commit -m "$MSG"

# Push
git push origin main

echo "Backup completed successfully at $TIMESTAMP"
