"use strict";

const TABLE_NAME = "collections";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    await queryInterface.createTable(TABLE_NAME, {
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      // ADD ATTRIBUTES HERE

      outlet_name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      stack_end_location: {
        type: DataTypes.GEOMETRY("POINT", 4326),
        allowNull: false,
      },
      courier: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      stack_radius: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      stacking_til: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(TABLE_NAME);
  },
};
