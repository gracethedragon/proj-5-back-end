import initModels from "./models/index.js";
import crypto from "crypto";
import { systemConfig } from "../config/index.js";

const hashPassword = (plain) =>
  crypto
    .createHmac("sha256", systemConfig.DB_PASSWORD_HASH)
    .update(plain)
    .digest("hex");

const JWT_SECRET = crypto.randomBytes(256).toString("base64");

const attachAuthApi = (User) => {
  const createUser = async (username, plainPassword) => {
    const user = await User.create({
      username,
      password: hashPassword(plainPassword),
    });

    return user;
  };

  const getUserByUsername = async (username) =>
    await User.findOne({ where: { username } });

  const getUsernameOfUserId = async (id) => {
    const user = await User.findOne({ where: { id } });

    return user.getDataValue("username");
  };

  const isUserExistingByUsername = async (username) =>
    !!(await getUserByUsername(username));

  const registerUser = async ({ username, plainPassword, password2 }) => {
    const is = await isUserExistingByUsername(username);

    if (is) {
      return [null, "Username taken :("];
    }
    console.log("username taken");

    if (plainPassword !== password2) {
      return [null, "Confirmation password mismatch."];
    }
    if (!username) {
      return [null, "Username must have at least 1 character"];
    }
    if (!plainPassword || !password2) {
      return [null, "Password must have at least 1 character"];
    }

    const user = await createUser(username, plainPassword);

    const id = user.getDataValue("id");
    const createdUsername = user.getDataValue("username");

    console.log(
      `[registerUser] user created { id : ${id} , username: ${createdUsername} }`
    );

    return [id, `Registration Success: #${id} : ${createdUsername} `];
  };

  const getAccessToken = async ({ username, password: clearPassword }) => {
    if (!username) {
      return {
        accessToken: null,
        msg: "User field should not be empty :(",
      };
    }
    const details = await getUserByUsername(username);
    if (!details) {
      return {
        accessToken: null,
        msg: "User not found.",
      };
    }
    const passwordReceivedHashed = hashPassword(clearPassword);
    const passwordDatabaseHashed = details.getDataValue("password");

    const userId = details.getDataValue("id");
    const isMatch = passwordReceivedHashed === passwordDatabaseHashed;

    if (!isMatch) {
      return {
        accessToken: null,
        msg: "Credentials mismatch.",
      };
    }

    const accessToken = newAccessToken({ sub: userId });
    return { accessToken, msg: "ok" };
  };
  const isVerifiedToken = async (accessToken) => {
    const [is, sub] = await verifyToken(accessToken);

    return is;
  };

  return {
    registerUser,
    getAccessToken,
    isVerifiedToken,
    getUsernameOfUserId,
  };
};

export const initDatabase = (sequelize) => {
  initModels(sequelize);

  const models = sequelize.models;

  const auth = attachAuthApi(models.user);

  const wipe = async () => {
    const { user } = models;
    for await (const model of [user]) {
      await model.destroy({ where: {} });
    }
  };

  const seed = async (_ = { isRandom: true }) => {
    // TODO - move to test
    const password = "t";
    await auth.registerUser({
      username: "t",
      plainPassword: password,
      password2: password,
    });
  };

  return {
    sequelize,
    Sequelize: sequelize.Sequelize,
    DataTypes: sequelize.DataTypes,
    models,
    wipe,
    seed,
    api: {
      auth,
    },
  };
};

export default initDatabase;
