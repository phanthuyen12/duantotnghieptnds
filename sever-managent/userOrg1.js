const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');

async function main() {
    // 1. Tạo wallet để lưu trữ thông tin danh tính
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // 2. Kiểm tra xem danh tính đã tồn tại trong wallet chưa
    const identity = await wallet.get('owner26');
    if (!identity) {
        console.log('Danh tính "owner26" không tồn tại trong wallet');

        // Thực hiện đăng ký danh tính mới nếu không tồn tại
        await registerIdentity(wallet);
        console.log('Đã đăng ký danh tính "owner26" thành công.');
    } else {
        console.log('Danh tính "owner26" đã tồn tại trong wallet.');
    }
}

async function registerIdentity(wallet) {
    const fabricCAClient = new FabricCAServices('https://localhost:7054'); // Địa chỉ CA của bạn
    const adminIdentity = await wallet.get('adminorg1'); // Đảm bảo rằng bạn đã có danh tính admin trong wallet

    // Kết nối tới CA với danh tính admin
    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'adminorg1');

    // Đăng ký danh tính mới
    const secret = await fabricCAClient.register({
        affiliation: 'org1.department1',
        enrollmentID: 'owner26', // Thay đổi thành owner26
        enrollmentSecret: 'ownerpw2', // Mật khẩu mới cho owner26
        role: 'client',
    }, adminUser);

    console.log(`Đã đăng ký danh tính "owner26" với mật khẩu: ${secret}`);

    // Lưu danh tính vào wallet
    const enrollment = await fabricCAClient.enroll({
        enrollmentID: 'owner26', // Sử dụng owner26 để enroll
        enrollmentSecret: secret,
    });

    const x509Identity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toString('utf8'), // Đảm bảo rằng khóa được chuyển đổi thành chuỗi đúng cách
        },
        mspId: 'Org1MSP',
        type: 'X.509',
    };

    await wallet.put('owner26', x509Identity);
    console.log('Danh tính "owner26" đã được lưu vào wallet.');
}

main().catch(console.error);
