`docker buildx imagetools inspect python:3.11-slim`

```
docker pull python:3.11-slim
docker inspect --format='{{index .RepoDigests 0}}' python:3.11-slim
# prints like: python@sha256:...
```
