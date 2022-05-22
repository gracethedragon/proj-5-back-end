"use strict";

const TABLE_NAME = "collectible_orders";

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

      collection_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      drop_off_point: {
        type: DataTypes.GEOMETRY("POINT", 4326),
        allowNull: false,
      },
      is_collected: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(TABLE_NAME);
  },
};

// const {
//     collection_id,
//     dropOffPoint, // coordinate
//     isCollected, // boolean
//     username// purchaser
//   }      = o
