const ENVIRONMENT = process.env.NODE_ENV || "development";

const DB_PASSWORD_HASH = "very-insecure-password-hash";
console.log(`ENVIRONMENT is ${ENVIRONMENT}`);

const ingressPort = 3002;
export default { ingressPort, ENVIRONMENT, DB_PASSWORD_HASH };
