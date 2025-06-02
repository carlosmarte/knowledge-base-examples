```js
// sequelize.js
import { Sequelize } from "sequelize";

const sequelize = new Sequelize("sqlite::memory:"); // or your real DB config

export default sequelize;
```

```
npm install csv-parse sequelize sqlite3
```

```
chmod +x schema-generator.js
```
