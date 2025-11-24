# Save Changes to Branch Safely

```yaml
- name: Save Changes to Branch Safely
  run: |
    git config --global user.name "<User Name>"
    git config --global user.email "<User Email>"

    git fetch origin main
    git checkout main
    git pull --rebase origin main

    git add .
    git diff-index --quiet HEAD || (
      git commit -am "GitHub Action: Auto commit from CI" &&
      git push origin main
    )
```

# Push to a Temporary Branch Instead

```yaml
- name: Push to CI Branch
  run: |
    BRANCH="ci-update-$(date +%s)"
    git checkout -b "$BRANCH"
    git push origin "$BRANCH"
    gh pr create --base main --head "$BRANCH" --title "CI Update" --body "Auto PR from CI job"
```
