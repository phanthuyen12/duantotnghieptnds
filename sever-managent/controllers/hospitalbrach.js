const path = require("path");
const fs = require("fs");
const { Gateway, Wallets } = require("fabric-network");
const bcrypt = require('bcrypt');
const { connectToNetworkorgvalue ,connectToNetworkorg} = require('../controllers/network');

exports.index = async (req, res) => {
    const _value = req.query.model;
    const { contract, gateway } = await connectToNetworkorgvalue(_value);

}
exports.createrecord = async (req, res) => {
    const { name, birthDate, gender, address, phoneNumber, identityCard, cccd, passwordmedical } = req.body;
    console.log('Request body:', req.body);

    if (!name || !birthDate || !gender || !address || !phoneNumber || !identityCard || !cccd) {
        return res.status(400).send('Invalid input');
    }

    try {
        const { contract, gateway } = await connectToNetwork();
        const currentTime = new Date();
        const saltRounds = 10;
        const passwordmedicalnew = await bcrypt.hash(passwordmedical, saltRounds);


        const result = await contract.submitTransaction('createRecord', name, birthDate, gender, address, phoneNumber, identityCard, cccd, currentTime, passwordmedicalnew);

        if (result) {
            console.log('Transaction result:', result.toString());
            res.status(200).send('Organization has been added');
        } else {
            console.error('Result is undefined');
            res.status(500).send('Unexpected result from transaction');
        }

        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error.message}`);
        res.status(500).send(`Failed to add organization: ${error.message}`);
    }
};

exports.create_brach = async (req, res) => {
    const {value,tokeorg, branchname, branchaddress, branchphone, branchemail, branchbusinesslicense} = req.body;
    console.log('Request body:', req.body);
    try {
        const { contract, gateway } = await connectToNetworkorgvalue(value);
        const timecreate = new Date();
        const result = await contract.submitTransaction('createrdetailbranch', tokeorg, branchname, branchaddress, branchphone, branchemail, branchbusinesslicense, timecreate);

        if (result) {
            console.log('Transaction result:', result.toString());
            res.status(200).json({ success: true }); // Trả về true khi thành công
        } else {
            console.error('Result is undefined');
            res.status(500).json({ success: false }); // Trả về false nếu không có kết quả
        }

        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error.message}`);
        res.status(500).send(`Failed to add organization: ${error.message}`);
    }
}
exports.getFull_brach= async(req,res)=>{
    try {
        const {value,tokeorg} = req.body;
        if (!tokeorg) {
            return res.status(400).json({ success: false, message: 'Tokenorg is required' });
        }

        if (!value) {
            return res.status(400).json({ success: false, message: 'Value is required' });
        }

        console.log('Request body:', req.body);
        const { contract, gateway } = await connectToNetworkorgvalue(value);
        const result = await contract.submitTransaction('getFullHospitalBranches',tokeorg);

        if (result) {
            console.log('Transaction result:', result.toString());
            parsedResult = JSON.parse(result); // Chuyển đổi kết quả thành JSON

            res.status(200).json({ success: true ,
                data:parsedResult
            }); // Trả về true khi thành công
        } else {
            console.error('Result is undefined');
            res.status(500).json({ success: false }); // Trả về false nếu không có kết quả
        }

        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error.message}`);
        res.status(500).send(`Failed to add organization: ${error.message}`);
    }

}
exports.getFull_personnel= async(req,res)=>{
    try {
        const {tokeorg,value} = req.body;
        console.log(req.body);
        if (!tokeorg) {
            return res.status(400).json({ success: false, message: 'Tokenorg is required' });
        }

        console.log('Request body:', req.body);
        const { contract, gateway } = await connectToNetworkorgvalue(value);
        const result = await contract.submitTransaction('getfullpersonnel',tokeorg);

        if (result) {
            // console.log('Transaction result:', result.toString());
            parsedResult = JSON.parse(result); // Chuyển đổi kết quả thành JSON

            res.status(200).json({ success: true ,
                data:parsedResult
            }); // Trả về true khi thành công
        } else {
            console.error('Result is undefined');
            res.status(500).json({ success: false }); // Trả về false nếu không có kết quả
        }

        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error.message}`);
        res.status(500).send(`Failed to add organization: ${error.message}`);
    }

}

exports.getpersonnelBytoken = async (req, res) => {
    try {
        const { tokeorg, value, tokenuser } = req.body;
        console.log(req.body);
        
        if (!tokeorg || !tokenuser) {
            return res.status(400).json({ success: false, message: 'Tokenorg and tokenuser are required' });
        }

        console.log('Request body:', req.body);

        const { contract, gateway } = await connectToNetworkorgvalue(value);

        // Thay đổi từ submitTransaction sang evaluateTransaction
        const result = await contract.evaluateTransaction('getUserByTokeorg', tokeorg, tokenuser);

        if (result) {
            // Chuyển đổi kết quả thành JSON
            const parsedResult = JSON.parse(result.toString());

            res.status(200).json({ success: true, data: parsedResult });
        } else {
            console.error('Result is undefined');
            res.status(500).json({ success: false, message: 'No result returned from transaction' });
        }

        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error.message}`);
        res.status(500).send(`Failed to get personnel: ${error.message}`);
    }
}