"use strict";

const TABLE_NAME = "outlets";
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

      // ADD ATTRIBUTES HERE
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },

      coordinates: {
        type: DataTypes.GEOMETRY("POINT"),
        allowNull: false,
      },
      street_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      building_no: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      postal_code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(TABLE_NAME);
  },
};
