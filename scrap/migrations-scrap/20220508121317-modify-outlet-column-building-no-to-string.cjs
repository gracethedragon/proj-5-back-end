"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    return Promise.all([
      queryInterface.changeColumn("outlets", "building_no", {
        type: DataTypes.STRING,
      }),
    ]);
  },

  async down(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.changeColumn("outlets", "building_no", {
        type: Sequelize.DataTypes.INTEGER,
      }),
    ]);
  },
};
