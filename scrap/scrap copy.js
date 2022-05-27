import { CurrentPriceChecker } from "../express/index.js";

const some = await CurrentPriceChecker();

console.log(some);
console.log(some.quote);
