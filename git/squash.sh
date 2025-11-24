#!/bin/bash

# Check if a commit message was provided
if [ $# -eq 0 ]; then
    echo "Error: Please provide a commit message"
    echo "Usage: $0 \"your commit message\""
    exit 1
fi

# Store the commit message
commit_msg="$1"

echo "commit message: $commit_msg"

# Create a new orphan branch (branch with no history)
git checkout --orphan reset_history_branch

# Add all files to the new branch
git add -A

# Commit the changes with the provided message
git commit -m "$commit_msg"

# Delete the main branch
git show-ref --verify --quiet refs/heads/main && git branch -D main

# Rename temp branch to main && Force push to remote repository
if git branch -m reset_history_branch main; then
  git push -u origin main -f
  # Remove old refs (optional cleanup)
  git gc --aggressive --prune=all
  echo "Branch renamed successfully!"
else
  echo "Failed to rename branch!"
fi

exit 0
