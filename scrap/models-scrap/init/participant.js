import { Sequelize } from "sequelize";

const MODEL_NAME = "participant";
/**
 * @param {Sequelize} sequelize
 */
export default (sequelize) => {
  const { DataTypes } = sequelize.Sequelize;

  const { user: User, room: Room } = sequelize.models;
  if (!(User && Room)) {
    throw new Error(
      `[model] [${MODEL_NAME}] Are you sure there's valid model references? ${User} ${Room}`
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
      participantId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
          model: User,
          key: "id",
        },
      },
      roomId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: Room,
          key: "id",
        },
      },
      teamNo: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
