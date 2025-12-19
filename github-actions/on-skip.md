
```yml
jobs:
  precheck:
    runs-on: ubuntu-latest
    outputs:
      run_ci: ${{ steps.decide.outputs.run_ci }}
      reason: ${{ steps.decide.outputs.reason }}
    steps:
      - id: decide
        run: |
          # example condition
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "run_ci=true" >> "$GITHUB_OUTPUT"
            echo "reason=Running on main" >> "$GITHUB_OUTPUT"
          else
            echo "run_ci=false" >> "$GITHUB_OUTPUT"
            echo "reason=Skipping: not on main" >> "$GITHUB_OUTPUT"
          fi

      - name: Show skip reason in UI
        run: |
          echo "::notice::${{ steps.decide.outputs.reason }}"
          echo "### CI decision" >> "$GITHUB_STEP_SUMMARY"
          echo "- ${{ steps.decide.outputs.reason }}" >> "$GITHUB_STEP_SUMMARY"
        # notice annotations are supported via workflow commands  [oai_citation:3‡GitHub Docs](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands?utm_source=chatgpt.com)

  build:
    needs: precheck
    if: needs.precheck.outputs.run_ci == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: echo "do build"

  test:
    needs: precheck
    if: needs.precheck.outputs.run_ci == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: echo "do tests"
```
