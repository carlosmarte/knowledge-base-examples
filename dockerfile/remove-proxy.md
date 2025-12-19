```
ENV HTTP_PROXY= \
    HTTPS_PROXY= \
    NO_PROXY= \
    http_proxy= \
    https_proxy= \
    no_proxy=
```

```
docker build \
  --build-arg HTTP_PROXY= \
  --build-arg HTTPS_PROXY= \
  --build-arg NO_PROXY= \
  -t myimg .
```

```
RUN unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy NO_PROXY no_proxy; \
    your-command-here
```
