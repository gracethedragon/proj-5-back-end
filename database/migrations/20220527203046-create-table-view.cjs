const TABLE_NAME = "views";

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
      view_id: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: "view_ownerships",
          },
          key: "id",
        },
        allowNull: false,
        onDelete: "CASCADE",
      },
      transaction_id: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: "tracked_transactions",
          },
          key: "id",
        },
        allowNull: false,
        onDelete: "CASCADE",
      },
    });
  },
  async down(queryInterface, _) {
    await queryInterface.dropTable(TABLE_NAME);
  },
};
