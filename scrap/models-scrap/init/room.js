import { Sequelize } from "sequelize";

/**
 * @param {Sequelize} sequelize
 */
export default (sequelize) => {
  const { DataTypes } = sequelize.Sequelize;
  const model = sequelize.define(
    "room",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        field: "id",
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        field: "created_at",
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        field: "updated_at",
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "name",
      },
      creatorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: sequelize.models.user,
          key: "id",
        },
        field: "creator_id",
      },
    },
    {
      underscored: true,
    }
  );
  if (model !== sequelize.models.room) {
    throw new Error("model reference mismatch");
  }
  return model;
};
