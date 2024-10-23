'use strict';

const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function registerUser() {
    try {
        // Load the network configuration
        const ccpPath = path.resolve(__dirname, '..', 'network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
        const ccp = JSON.parse(ccpJSON);

        // Create a new CA client for interacting with the CA
        const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
        const ca = new FabricCAServices(caURL);

        // Create a new file system based wallet for managing identities
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user
        const adminIdentity = await wallet.get('adminorg1');
        if (!adminIdentity) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return false; // Trả về false nếu admin không tồn tại
        }

        // Check to see if we've already registered the user
        const userExists = await wallet.get('userorg1');
        if (userExists) {
            console.log('An identity for the user "userorg1" already exists in the wallet');
            return false; // Trả về false nếu user đã tồn tại
        }

        // Build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'adminorg1');

        // Register the user, enroll the user, and import the new identity into the wallet
        const secret = await ca.register({
            affiliation: '',
            enrollmentID: 'userorg1',
            role: 'client',
            attrs: [{ name: 'username', value: 'userorg1', ecert: true }]
        }, adminUser);

        const enrollment = await ca.enroll({
            enrollmentID: 'userorg1',
            enrollmentSecret: secret
        });

        const userIdentity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        await wallet.put('userorg1', userIdentity);
        console.log('Successfully registered and enrolled user "userorg1" and imported it into the wallet');
        return true; // Trả về true nếu thành công

    } catch (error) {
        console.error(`Failed to register user "userorg1": ${error.message}`);
        return false; // Trả về false nếu có lỗi
    }
}
registerUser();
module.exports = { registerUser };
