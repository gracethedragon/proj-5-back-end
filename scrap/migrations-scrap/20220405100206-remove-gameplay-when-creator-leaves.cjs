"use strict";

const TABLE_NAME = "gameplays";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;
    await queryInterface.removeConstraint(TABLE_NAME, "gameplays_room_id_fkey");

    await queryInterface.addConstraint(TABLE_NAME, {
      fields: ["room_id"],
      type: "foreign key",
      name: "custom_fkey_constraint_name_rooms_gameplay",
      references: {
        //Required field
        table: "rooms",
        field: "id",
      },
      onDelete: "cascade",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      TABLE_NAME,
      "custom_fkey_constraint_name_rooms_gameplay"
    );
  },
};
