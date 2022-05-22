"use strict";

const TABLE_NAME = "gameplays";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    await queryInterface.addColumn(TABLE_NAME, "last_known_round", {
      type: DataTypes.STRING,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(TABLE_NAME, "last_known_round");
  },
};
