/**
 *
 * @typedef {string} Network
 */

/**
 *
 * @typedef {Object} HashData
 * @property {number} valueUSD
 * @property {number} qty Amount of Coins
 * @property {Date} date
 * @property {Network} network
 * @property {TransactionHash} transactionHash
 */

/**
 *
 *  @typedef {Object} Value
 * @property {Date} date
 * @property {number} value in USD
 */

/**
 * @typedef {Value} TxValue
 */

/**
 *
 * @typedef {Object} TransactionFE
 *  @property {string} hash
 *  @property {number} qty
 *  @property {number} id
 * @property  {string} network
 * @property  {string} transactionType
 * @property  {TxValue} txValue value at the point of transaction
 * @property  {Value} currentValue
 * @property  {number} unitCostPrice
 */

/**
 *
 * @typedef {Object} PriceChecker
 * @property {Value} ETH
 */

/**
 *
 * @typedef {Object} Statistics
 * @property {number} outlay
 * @property {number} unrealrev
 * @property {number} saleoutlay
 * @property {number} unrealgl
 * @property {number} realgl
 * @property {number} actualrev
 */

/**
 *
 * @typedef {Object} TransactionView
 * @property {Statistics} stats
 * @property {Array<TransactionFE>} transactions
 */

/**
 * @typedef {string} Username
 */

/**
 * @typedef {Username} Tracker
 */

/**
 * @typedef {string} TransactionHash
 */

/**
 * @typedef {string} TransactionType asfr
 */

/**
 * @typedef {Object} TransactionDBColumns
 * @property {number} id
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {TransactionHash} transactionHash transaction hash
 * @property {Tracker} tracker username of tracker
 * @property {number} value qty at the point of transaction
 * @property {Date} date date of transaction
 * @property {number} valueUSD
 * @property {string} token token type
 * @property {TransactionType} type type of transaction
 * @property {number} unitCostPrice
 * @property {string} network
 */
