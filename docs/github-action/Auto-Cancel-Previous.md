name: Auto-Cancel Previous Workflows

on:
  push:
    branches:
      - main

jobs:
  cancel-previous:
    runs-on: ubuntu-latest
    steps:
      - name: Cancel previous runs
        uses: styfle/cancel-workflow-action@0.12.1
        with:
          access_token: ${{ secrets.GITHUB_TOKEN }}
