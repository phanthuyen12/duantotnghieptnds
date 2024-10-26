'use strict';

const MedicalBookChaincode = require('./lib/medicalBookChaincode');

module.exports.MedicalBookChaincode = MedicalBookChaincode;


module.exports.contracts = [MedicalBookChaincode ];
