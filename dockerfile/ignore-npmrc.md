```
cat > /tmp/ci.npmrc <<'EOF'
registry=https://registry.npmjs.org/
always-auth=false
EOF

NPM_CONFIG_USERCONFIG=/tmp/ci.npmrc \
NPM_CONFIG_GLOBALCONFIG=/dev/null \
npm ci
```
