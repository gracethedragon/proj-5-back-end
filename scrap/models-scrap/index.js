export default class DbModel {
  _modelCollectibleOrder = () => {
    const MODEL_NAME = "collectibleOrder";
    const model = this.sequelize.define(
      MODEL_NAME,
      {
        createdAt: {
          allowNull: false,
          type: this.DataTypes.DATE,
          field: "created_at",
        },
        updatedAt: {
          allowNull: false,
          type: this.DataTypes.DATE,
          field: "updated_at",
        },
        id: {
          autoIncrement: true,
          type: this.DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
          field: "id",
        },
        collectionId: {
          type: this.DataTypes.INTEGER,
          allowNull: false,
          field: "collection_id",
        },
        dropOffPoint: {
          type: this.DataTypes.GEOMETRY("POINT", 4326),
          allowNull: false,
          field: "drop_off_point",
        },
        isCollected: {
          type: this.DataTypes.BOOLEAN,
          allowNull: false,
          field: "is_collected",
        },
        username: {
          type: this.DataTypes.STRING,
          allowNull: false,
          field: "username",
        },
      },
      {
        underscored: true,
        tableName: "collectible_orders",
      }
    );
    if (model !== this.sequelize.models[[MODEL_NAME]]) {
      throw new Error("model reference mismatch");
    }
    return model;
  };

  _modelCollection = () => {
    const MODEL_NAME = "collection";
    const model = this.sequelize.define(
      MODEL_NAME,
      {
        createdAt: {
          allowNull: false,
          type: this.DataTypes.DATE,
          field: "created_at",
        },
        updatedAt: {
          allowNull: false,
          type: this.DataTypes.DATE,
          field: "updated_at",
        },
        id: {
          autoIncrement: true,

          type: this.DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
          field: "id",
        },
        // ADD ATTRIBUTES HERE

        outletName: {
          type: this.DataTypes.STRING,
          allowNull: false,
          field: "outlet_name",
        },

        stackEndLocation: {
          type: this.DataTypes.GEOMETRY("POINT", 4326),
          allowNull: false,
          field: "stack_end_location",
        },
        courier: {
          type: this.DataTypes.STRING,
          allowNull: false,

          field: "courier",
        },
        stackRadius: {
          type: this.DataTypes.INTEGER,
          allowNull: false,
          field: "stack_radius",
        },
        stackingTil: {
          type: this.DataTypes.BIGINT,
          allowNull: false,
          field: "stacking_til",
        },
      },
      {
        underscored: true,
        tableName: "collections",
      }
    );
    if (model !== this.sequelize.models[[MODEL_NAME]]) {
      throw new Error("model reference mismatch");
    }
    return model;
  };
  _modelSession = () => {
    const MODEL_NAME = "lastKnownSessionUser";
    const model = this.sequelize.define(
      MODEL_NAME,
      {
        createdAt: {
          allowNull: false,
          type: this.DataTypes.DATE,
          field: "created_at",
        },
        updatedAt: {
          allowNull: false,
          type: this.DataTypes.DATE,
          field: "updated_at",
        },

        // ADD ATTRIBUTES HERE
        id: {
          type: this.DataTypes.STRING,
          primaryKey: true,
          allowNull: false,
          field: "id",
        },
        userId: {
          type: this.DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: this.User,
            key: "id",
          },
          field: "user_id",
        },
      },
      {
        underscored: true,
      }
    );
    if (model !== this.sequelize.models[[MODEL_NAME]]) {
      throw new Error("model reference mismatch");
    }
    return model;
  };
  _modelDistrict = () => {
    const _model = this.sequelize.define(
      "district",
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: this.DataTypes.INTEGER,
          field: "id",
        },
        createdAt: {
          allowNull: false,
          type: this.DataTypes.DATE,
          field: "created_at",
        },
        updatedAt: {
          allowNull: false,
          type: this.DataTypes.DATE,
          field: "updated_at",
        },
        name: {
          type: this.DataTypes.STRING,
          allowNull: false,
          field: "name",
        },
        nearbyOutletId: {
          type: this.DataTypes.INTEGER,
          references: {
            model: this.User,
            key: "id",
          },
          allowNull: false,
          field: "nearby_outlet_id",
        },
      },
      {
        underscored: true,
      }
    );
    if (_model !== this.sequelize.models.district) {
      throw new Error("model reference mismatch");
    }
    console.log(`[DbModel] _modelDistrict`);

    return _model;
  };

  _modelOutlet = () => {
    const _model = this.sequelize.define(
      "outlet",
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: this.DataTypes.INTEGER,
          field: "id",
        },
        createdAt: {
          allowNull: false,
          type: this.DataTypes.DATE,
          field: "created_at",
        },
        updatedAt: {
          allowNull: false,
          type: this.DataTypes.DATE,
          field: "updated_at",
        },
        coordinates: {
          type: this.DataTypes.GEOMETRY("POINT", 4326),
          allowNull: false,
          field: "coordinates",
        },
        streetName: {
          type: this.DataTypes.STRING,
          field: "street_name",
          allowNull: false,
        },
        buildingNo: {
          type: this.DataTypes.STRING,
          field: "building_no",
          allowNull: false,
        },
        postalCode: {
          field: "postal_code",
          type: this.DataTypes.STRING,
          allowNull: false,
        },
        name: {
          type: this.DataTypes.STRING,
          allowNull: false,
          field: "name",
        },
      },
      {
        underscored: true,
      }
    );
    if (_model !== this.sequelize.models.outlet) {
      throw new Error("model reference mismatch");
    }
    console.log(`[DbModel] _modelOutlet`);

    return _model;
  };

  _modelUser = () => {
    const userModel = this.sequelize.define(
      "user",
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: this.DataTypes.INTEGER,
          field: "id",
        },
        createdAt: {
          allowNull: false,
          type: this.DataTypes.DATE,
          field: "created_at",
        },
        updatedAt: {
          allowNull: false,
          type: this.DataTypes.DATE,
          field: "updated_at",
        },
        username: {
          type: this.DataTypes.STRING,
          allowNull: false,
          field: "username",
        },
        password: {
          type: this.DataTypes.STRING,
          allowNull: false,
          field: "password",
        },
        credit: {
          type: this.DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: "credit",
        },
      },
      {
        underscored: true,
      }
    );
    if (userModel !== this.sequelize.models.user) {
      throw new Error("model reference mismatch");
    }
    console.log(`[DbModel] _modelUser`);

    return userModel;
  };

  constructor(sequelize) {
    this.sequelize = sequelize;
    this.Sequelize = this.sequelize.Sequelize;
    this.DataTypes = this.Sequelize.DataTypes;
    this.User = this._modelUser();
    this.Outlet = this._modelOutlet();
    this.District = this._modelDistrict();
    this.LastKnownSessionUser = this._modelSession();
    this.Collection = this._modelCollection();
    this.CollectibleOrder = this._modelCollectibleOrder();

    [
      this.User,
      this.District,
      this.Outlet,
      this.LastKnownSessionUser,
      this.Collection,
      this.CollectibleOrder,
    ].forEach((k, i) => {
      if (!k) {
        throw new Error(`k ${i}`);
      }
    });
  }
}
