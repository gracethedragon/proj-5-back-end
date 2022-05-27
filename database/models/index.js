const initModel_TrackedTransactions = (sequelize, DataTypes) => {
  const model = sequelize.define(
    "trackedTransaction",
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
      tracker: {
        type: DataTypes.STRING,
        references: {
          model: {
            tableName: "users",
          },
          key: "username",
        },
        allowNull: false,
        field: "tracker",
      },
      value: {
        type: DataTypes.DOUBLE,
        allowNull: false,

        field: "value",
      },
      network: {
        type: DataTypes.ENUM(["ETH", "BTC"]),
        allowNull: false,
        field: "network",
      },

      valueUSD: {
        type: DataTypes.DOUBLE,
        allowNull: false,

        field: "valueUSD",
      },

      date: {
        type: DataTypes.DATE,
        allowNull: false,

        field: "date",
      },
      type: {
        type: DataTypes.ENUM(["TRANSFER-IN", "BUY", "SELL"]),
        field: "type",
        allowNull: false,
      },
      transactionHash: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "transaction_hash",
      },
    },
    {
      tableName: "tracked_transactions",
      underscored: true,
    }
  );
  return model;
};

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
      tableName: "users",
    }
  );
  return model;
};

const initModels = (sequelize) => {
  const Sequelize = sequelize.Sequelize;
  const DataTypes = Sequelize.DataTypes;
  initModel_User(sequelize, DataTypes);
  initModel_TrackedTransactions(sequelize, DataTypes);
};

export default initModels;
