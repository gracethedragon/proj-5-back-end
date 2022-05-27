const TABLE_NAME = "view_ownerships";

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
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      owner: {
        type: DataTypes.STRING,
        references: {
          model: {
            tableName: "users",
          },
          key: "username",
        },
        allowNull: false,
      },
    });
  },
  async down(queryInterface, _) {
    await queryInterface.dropTable(TABLE_NAME);
  },
};
