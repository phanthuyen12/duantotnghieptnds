'use strict';

const path = require('path');
const { exec } = require('child_process');
const { connectToNetworkorg } = require('../../sever-managent/controllers/network'); // Adjust the path according to your directory structure
const { updateOrganizationStatus } = require('./updateOrg');
const { enrollAdmin } = require('../../sever-managent/enrollAdmin1');
const { registerUser } = require('../../sever-managent/registerUser1');

exports.setupOrganizationFolders = async (req, res) => {
    const value = req.body.value; // Get value from the request
    if (value === undefined) {
        return res.status(400).json({ error: 'No value provided' });
    }
    
    const scriptPath = path.join(__dirname, '../', 'tudong.sh');
    
    exec(`bash ${scriptPath} ${value}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).json({ status:false,error: 'Script execution failed', details: stderr });
        }
        
        console.log('Success');
        res.json({ status: true, output: stdout });
    });
}

exports.checkroleadmin = async (req, res) => {
    const value = req.body.value;
    const tokeorg = req.body.tokeorg;
    console.log(req.body);

    if (!value) {
        return res.status(400).send("Invalid input");
    }

    let gateway;
    try {
        const { contract, gateway: gw } = await connectToNetworkorg();
        gateway = gw;

        const result = await contract.submitTransaction("checkroleAdmin");

        if (!result) {
            console.error("Result is undefined");
            return res.status(500).send("Unexpected result from transaction");
        }

        console.log("Transaction result:", result.toString());

        const isAdmin = result.toString().toLowerCase() === 'true';

        if (isAdmin) {
            const scriptPath = path.join(__dirname, '../', 'tudong.sh');

            // Sử dụng exec với Promise để dễ xử lý bất đồng bộ
            exec(`bash ${scriptPath} ${value}`, async (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    if (!res.headersSent) {
                        return res.status(500).json({ error: 'Script execution failed', details: stderr });
                    }
                    return; // Tránh gửi phản hồi nhiều lần
                }

                console.log('Script executed successfully');

                try {
                    // Đăng ký Admin và User
                    await enrollAdmin(value);
                    await registerUser(value);
                    console.log('test data')

                    const rusteldata = await updateOrganizationStatus(tokeorg); // Chuyển tokeorg vào

                    if (rusteldata) {
                        return res.status(200).json({ status: "true" ,data:rusteldata});
                    } else {
                        return res.status(500).json({ error: 'User registration failed' });
                    }
                } catch (error) {
                    // Xử lý lỗi, chỉ gửi phản hồi nếu chưa gửi trước đó
                    console.error(`Failed to process request: ${error.message}`);
                    if (!res.headersSent) {
                        return res.status(500).json({ error: 'Failed to process request', details: error.message });
                    }
                }
            });
        } else {
            if (!res.headersSent) {
                return res.status(403).json({
                    message: "User is not an admin",
                    result: result.toString(),
                });
            }
        }
    } catch (error) {
        console.error(`Failed to submit transaction: ${error.message}`);
        if (!res.headersSent) {
            return res.status(500).send(`Failed to process transaction: ${error.message}`);
        }
    } finally {
        if (gateway) {
            await gateway.disconnect();
        }
    }
};