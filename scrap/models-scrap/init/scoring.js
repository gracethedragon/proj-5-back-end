import { Sequelize } from "sequelize";

/**
 * @param {Sequelize} sequelize
 */
export default (sequelize) => {
  const MODEL_NAME = "scoring";

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
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "updated_at",
      },
      // ADD ATTRIBUTES HERE

      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        field: "id",
        autoIncrement: true,
      },

      roundId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "round_id",
      },
      teamNo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "team_no",
      },
      chain: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "chain",
      },
      credit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "credit",
      },
      scorerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "scorer_id",
        references: {
          model: User,
          key: "id",
        },
        onDelete: "cascade",
      },
    },
    {
      underscored: true,
    }
  );
  if (model !== sequelize.models.scoring) {
    throw new Error("model reference mismatch");
  }

  return model;
};
