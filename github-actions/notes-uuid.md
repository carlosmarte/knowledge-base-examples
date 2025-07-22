```yaml
name: Generate Job ID

on:
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      JOB_NAME: example-job  # Change this to your actual job identifier
    steps:
      - name: Generate timestamp, UUID, and jobId
        run: |
          TIMESTAMP=$(date +%Y%m%d%H%M%S)
          UUID=$(uuidgen)
          JOB_ID="${JOB_NAME}_${TIMESTAMP}_${UUID}"
          
          echo "TIMESTAMP=$TIMESTAMP" >> $GITHUB_ENV
          echo "UUID=$UUID" >> $GITHUB_ENV
          echo "JOB_ID=$JOB_ID" >> $GITHUB_ENV

      - name: Show generated values
        run: |
          echo "Job Name: $JOB_NAME"
          echo "Timestamp: $TIMESTAMP"
          echo "UUID: $UUID"
          echo "Generated Job ID: $JOB_ID"
        env:
          JOB_NAME: ${{ env.JOB_NAME }}
          TIMESTAMP: ${{ env.TIMESTAMP }}
          UUID: ${{ env.UUID }}
          JOB_ID: ${{ env.JOB_ID }}
```

```yaml
jobs:
  generate-uuid-python:
    runs-on: ubuntu-latest
    steps:
      - name: Generate UUID with Python
        run: |
          UUID=$(python3 -c "import uuid; print(uuid.uuid4())")
          echo "UUID=$UUID" >> $GITHUB_ENV

      - name: Use UUID
        run: echo "UUID is $UUID"
        env:
          UUID: ${{ env.UUID }}
```

```yaml
jobs:
  generate-uuid-node:
    runs-on: ubuntu-latest
    steps:
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Generate UUID with Node.js
        run: |
          UUID=$(node -e "console.log(require('crypto').randomUUID())")
          echo "UUID=$UUID" >> $GITHUB_ENV

      - name: Use UUID
        run: echo "The UUID is $UUID"
        env:
          UUID: ${{ env.UUID }}
```

```yaml
jobs:
  generate-uuid:
    runs-on: ubuntu-latest
    steps:
      - name: Generate UUID
        run: |
          UUID=$(uuidgen)
          echo "UUID=$UUID" >> $GITHUB_ENV

      - name: Use UUID
        run: echo "The generated UUID is $UUID"
        env:
          UUID: ${{ env.UUID }}
```
