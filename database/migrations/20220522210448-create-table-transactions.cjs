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
      transaction_hash: {
        type: DataTypes.STRING,
        allowNull: false,
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
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      valueUSD: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(["BUY", "SELL"]),
        allowNull: false,
      },
      network: {
        type: DataTypes.ENUM(["ETH", "BTC"]),
        allowNull: false,
      },
      unit_cost_price: {
        type: DataTypes.DOUBLE,
      },
    });
  },
  async down(queryInterface, _) {
    await queryInterface.dropTable(TABLE_NAME);
  },
};
