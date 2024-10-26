const path = require("path");
const fs = require("fs");
const { Gateway, Wallets } = require("fabric-network");
const bcrypt = require('bcrypt');
const {connectToNetworkorgvalue} =  require('../controllers/network');

exports.index = async (req, res) => {
    const _value = req.query.model;
    const { contract, gateway } = await connectToNetworkorgvalue(_value);

}