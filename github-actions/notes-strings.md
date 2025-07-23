```yaml
- name: Sanitize and create directory
  run: |
    CLEAN_ID=$(echo "${{ github.run_id }}" | sed 's/[^a-zA-Z0-9_-]//g')
    mkdir -p "./runs/$CLEAN_ID"
    echo "Using directory: ./runs/$CLEAN_ID"
```
