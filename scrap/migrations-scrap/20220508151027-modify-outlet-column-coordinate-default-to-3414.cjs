"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    return Promise.all([
      queryInterface.changeColumn("outlets", "coordinates", {
        type: DataTypes.GEOMETRY("POINT", 4326),
      }),
    ]);
  },

  async down(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.changeColumn("outlets", "coordinates", {
        type: Sequelize.DataTypes.GEOMETRY("POINT"),
      }),
    ]);
  },
};
/**
 * 
 * 4326 - standard
3414 - sg

3857 - google

 */
