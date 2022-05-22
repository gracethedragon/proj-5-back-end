"use strict";

const TABLE_NAME = "users";
const COLUMN_NAME = "credit";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    await queryInterface.addColumn(TABLE_NAME, COLUMN_NAME, {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME);
  },
};
