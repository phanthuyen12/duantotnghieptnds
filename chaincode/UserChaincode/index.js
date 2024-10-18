'use strict';

const UserContractcode = require('./lib/UserChaincode');

module.exports.UserContract = UserContractcode;
module.exports.contracts = [UserContractcode ];
