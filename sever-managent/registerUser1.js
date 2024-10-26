'use strict';

const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function registerUser(value) {
    try {
        // Load the network configuration
        const ccpPath = path.resolve(__dirname, '..', 'network', 'organizations', 'peerOrganizations', `${value}.example.com`, `connection-${value}.json`);
        const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
        const ccp = JSON.parse(ccpJSON);

        // Create a new CA client for interacting with the CA
        const caURL = ccp.certificateAuthorities[`ca.${value}.example.com`].url;
        const ca = new FabricCAServices(caURL);

        // Create a new file system based wallet for managing identities
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user
        const adminIdentity = await wallet.get(`admin${value}`);
        if (!adminIdentity) {
            console.log(`An identity for the admin user "admin${value}" does not exist in the wallet`);
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // Check to see if we've already registered the user
        const userExists = await wallet.get(`user${value}`);
        if (userExists) {
            console.log(`An identity for the user "user${value}" already exists in the wallet`);
            return false;
        }

        // Build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, `admin${value}`);

        // Register the user, enroll the user, and import the new identity into the wallet
        const secret = await ca.register({
            affiliation: '',
            enrollmentID: `user${value}`,
            role: 'client',
            attrs: [{ name: 'username', value: `user${value}`, ecert: true }]
        }, adminUser);

        const enrollment = await ca.enroll({
            enrollmentID: `user${value}`,
            enrollmentSecret: secret
        });

        const userIdentity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: `${value}MSP`,
            type: 'X.509',
        };

        await wallet.put(`user${value}`, userIdentity);
        console.log(`Successfully registered and enrolled user "user${value}" and imported it into the wallet`);
        return true

    }catch (error) {
        console.error(`Failed to register user "user${value}": ${error.message}`);
        throw new Error(`Failed to register user "user${value}": ${error.message}`);
    }
    
}
module.exports = { registerUser };

// // Replace 'org1' with the desired organization value when calling registerUser
// registerUser('org1');
