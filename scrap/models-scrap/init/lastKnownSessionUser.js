import { Sequelize } from "sequelize";

const MODEL_NAME = "lastKnownSessionUser";
/**
 * @param {Sequelize} sequelize
 */
export default (sequelize) => {
  const { DataTypes } = sequelize.Sequelize;

  const { user: User } = sequelize.models;
  if (!User) {
    throw new Error(
      `[model] [${MODEL_NAME}] Are you sure there's valid model references? ${User}`
    );
  }
  const model = sequelize.define(
    MODEL_NAME,
    {
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

      // ADD ATTRIBUTES HERE
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        field: "id",
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: User,
          key: "id",
        },

        field: "user_id",
      },
    },
    {
      underscored: true,
    }
  );
  if (model !== sequelize.models[[MODEL_NAME]]) {
    throw new Error("model reference mismatch");
  }
  return model;
};
