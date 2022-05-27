const TABLE_NAME = "tracked_transactions";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;
    await queryInterface.createTable(TABLE_NAME, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updated_at: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      tracker: {
        type: DataTypes.STRING,
        references: {
          model: {
            tableName: "users",
          },
          key: "username",
        },
        allowNull: false,
      },
      value: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      valueUSD: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      network: {
        type: DataTypes.ENUM(["ETH", "BTC"]),
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(["TRANSFER-IN", "BUY", "SELL"]),
        allowNull: false,
      },
      transaction_hash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    });
  },
  async down(queryInterface, _) {
    await queryInterface.dropTable(TABLE_NAME);
  },
};
