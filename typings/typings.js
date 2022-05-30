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
 * @property  {TxValue} txValue
 * @property  {Value} currentValue
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
 * @property {Tracker} tracker
 * @property {number} value
 * @property {Date} date
 * @property {number} valueUSD
 * @property {TransactionHash} transactionHash
 * @property {TransactionType} type
 */
