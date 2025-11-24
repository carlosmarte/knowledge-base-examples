npm install commander node-fetch js-yaml

```bash
chmod +x search-apps-yaml.js

./search-apps-yaml.js --token YOUR_GITHUB_TOKEN --key app.id
GITHUB_TOKEN=$YOUR_GITHUB_TOKEN npm run search:yaml

```

```js
import { run } from "./search-apps-yaml.js";

await run({
  token: process.env.GITHUB_TOKEN,
  key: "app.id",
  outputFile: "./apps_results.csv",
});
```
