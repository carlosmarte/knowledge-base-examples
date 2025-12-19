```
cat > /tmp/ci.npmrc <<'EOF'
registry=https://registry.npmjs.org/
always-auth=false
EOF

NPM_CONFIG_USERCONFIG=/tmp/ci.npmrc \
NPM_CONFIG_GLOBALCONFIG=/dev/null \
npm ci
```

```
npm config get userconfig
npm config get globalconfig
npm config ls -l
```
