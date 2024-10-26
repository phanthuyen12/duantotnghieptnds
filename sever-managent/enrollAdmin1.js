'use strict';

const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function enrollAdmin(value) {
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
        const adminExists = await wallet.get(`admin${value}`);
        if (adminExists) {
            console.log(`An identity for the admin user "admin${value}" already exists in the wallet`);
            return false;  // Return a value indicating admin already exists
        }
        
        // Enroll the admin user, and import the new identity into the wallet
        const enrollment = await ca.enroll({
            enrollmentID: 'admin',
            enrollmentSecret: 'adminpw'
        });

        const identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: `${value}MSP`,
            type: 'X.509',
        };

        await wallet.put(`admin${value}`, identity);
        console.log(`Successfully enrolled admin user "admin${value}" and imported it into the wallet`);
        return true

    }catch (error) {
        console.error(`Failed to enroll admin user "admin${value}": ${error.message}`);
        throw new Error(`Enrollment failed for admin ${value}: ${error.message}`);
    }
    
}

// Correct export statement
module.exports = { enrollAdmin };
