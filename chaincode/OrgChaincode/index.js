'use strict';

const OrgChaincode = require('./lib/OrgChaincode');


module.exports.OrgChaincode = OrgChaincode;

module.exports.contracts = [OrgChaincode];
