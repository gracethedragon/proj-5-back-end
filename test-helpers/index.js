import request from "supertest";

export const getTokenResponseFns = (app, username, password) => {
  const getTokenResponse = async () => {
    const res = await request(app)
      .get("/login")
      .set("Accept", "application/json")
      .query({ email: username, password });

    return res;
  };

  const getToken = async () => {
    const res = await getTokenResponse();
    return res.body.token;
  };

  return [getTokenResponse, getToken];
};

export const httpGetAllTransactions = async (app, token) =>
  await request(app)
    .get("/all-transactions")
    .set("Accept", "application/json")
    .query({
      token,
    });
