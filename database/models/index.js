const initModel_User = (sequelize, DataTypes) => {
  const model = sequelize.define(
    "user",
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
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "username",
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "password",
      },
    },
    {
      underscored: true,
    }
  );
  return model;
};

const initModels = (sequelize) => {
  const Sequelize = sequelize.Sequelize;
  const DataTypes = Sequelize.DataTypes;
  initModel_User(sequelize, DataTypes);
};

export default initModels;
