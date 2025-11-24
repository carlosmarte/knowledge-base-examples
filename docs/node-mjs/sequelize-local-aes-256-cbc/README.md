#Generate key: `openssl rand -hex 32`
`export ENCRYPTION_KEY=6d6f636b656e6372797074696f6e6b6579666f7264656d6f`

```js
import { DataTypes } from "sequelize";
import sequelize from "./sequelizeInstance.js"; // your sequelize instance

export const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    paranoid: true, // enables soft delete
    timestamps: true,
  }
);
```

```js
import { EncryptedModelService } from "./EncryptedModelService.js";
import { User } from "./models/User.js";

const userService = new EncryptedModelService(User, ["fullName", "email"]);

// Insert
await userService.insert({ fullName: "Alice Doe", email: "alice@example.com" });

// Find All
const users = await userService.findAll();

// Update
await userService.update(userId, { fullName: "Updated Name" });

// Soft Delete
await userService.softDelete(userId);

// Hard Delete
await userService.hardDelete(userId);
```
