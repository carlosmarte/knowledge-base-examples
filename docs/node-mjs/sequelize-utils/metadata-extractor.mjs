export async function getTableMetadata(sequelize, tableName) {
  const queryInterface = sequelize.getQueryInterface();
  try {
    const tableDescription = await queryInterface.describeTable(tableName);
    const result = {
      table: tableName,
      columns: [],
    };

    for (const [columnName, props] of Object.entries(tableDescription)) {
      result.columns.push({
        name: columnName,
        type: props.type,
        allowNull: props.allowNull,
        defaultValue: props.defaultValue,
        primaryKey: props.primaryKey,
        autoIncrement: props.autoIncrement,
        comment: props.comment,
      });
    }

    return result;
  } catch (err) {
    throw new Error(`Error describing table '${tableName}': ${err.message}`);
  }
}
