"use strict";

const TABLE_NAME = "gameplays";
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
      room_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: {
            tableName: "rooms",
          },
          key: "id",
        },
        allowNull: false,
      },
      chain: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(TABLE_NAME);
  },
};
