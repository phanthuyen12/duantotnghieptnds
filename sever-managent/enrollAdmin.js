'use strict';

const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function enrollAdmin() {
    try {
        const ccpPath = path.resolve(__dirname, '..', 'network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
        const ccp = JSON.parse(ccpJSON);

        const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
        const ca = new FabricCAServices(caURL);

        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const adminExists = await wallet.get('adminorg1');
        if (adminExists) {
            console.log('An identity for the admin user "admin" already exists in the wallet');
            return true; // Trả về true nếu admin đã tồn tại
        }

        const enrollment = await ca.enroll({
            enrollmentID: 'admin',
            enrollmentSecret: 'adminpw'
        });

        const identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        await wallet.put('adminorg1', identity);
        
        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');
        return true; // Trả về true nếu thành công

    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
        // Xử lý lỗi thay vì dừng ứng dụng
        return false; // Trả về false nếu có lỗi
    }
}
enrollAdmin();
// Export the function
// module.exports = { enrollAdmin };
