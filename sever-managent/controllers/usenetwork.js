const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { enrollAdmin } = require('../enrollAdmin');
const { registerUser } = require('../registerUser');

const dotenv = require('dotenv');  // Đảm bảo rằng dotenv đã được import
dotenv.config();  // Đọc file .env và nạp biến môi trường trước tiên

function reloadEnv() {
    dotenv.config({ path: '../.env' });  // Sử dụng dotenv đã được import để nạp lại
}

// Hàm mở network
exports.openNetwork = async (req, res) => {
    try {
        const networkScriptPath = path.resolve(__dirname, '../../network/network.sh');
        const networkDirPath = path.resolve(__dirname, '../../network');
        reloadEnv();  // Nạp lại biến môi trường sau khi cập nhật .env
        const NameNetworkValue = process.env.NAMENETWORK;

        console.log(`Đang mở network...${NameNetworkValue}`);

        const stdout = await new Promise((resolve, reject) => {
            exec(`cd ${networkDirPath} && bash ${networkScriptPath} createChannel -c ${NameNetworkValue} -ca`, (error, stdout, stderr) => {
                if (error) {
                    return reject(`Lỗi khi mở network: ${error.message}`);
                }
                if (stderr && stderr.trim()) {
                    console.error(`Cảnh báo khi mở network: ${stderr}`);
                }
                resolve(stdout);
            });
        });

        console.log(stdout); // In ra kết quả của lệnh nếu cần thiết
        res.status(200).json({ status: true, message: "Network đã được mở thành công!", output: stdout });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: error.message });
    }
};

// Hàm đóng network
exports.closeNetwork = async (req, res) => {
    try {
        const networkScriptPath = path.resolve(__dirname, '../../network/network.sh');
        const networkDirPath = path.resolve(__dirname, '../../network');
        console.log("Đang đóng network...");
        const stdout = await new Promise((resolve, reject) => {
            exec(`cd ${networkDirPath} && bash ${networkScriptPath} down`, (error, stdout, stderr) => {
                if (error) {
                    return reject(`Lỗi khi đóng network: ${error.message}`);
                }
                if (stderr && stderr.trim()) {
                    console.error(`Cảnh báo khi đóng network: ${stderr}`);
                }
                resolve(stdout);
            });
        });

        console.log(stdout); // In ra kết quả của lệnh nếu cần thiết
        res.status(200).json({ status: true, message: "Network đã được đóng thành công!", output: stdout });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: error.message });
    }
};

// Hàm cập nhật .env
exports.updateNetwork = async (req, res) => {
    const { NameNetwork } = req.body;
    console.log(req.body);

    if (!NameNetwork) {
        return res.status(400).json({ status: false, message: 'NameNetwork is required' });
    }

    // Đường dẫn đến file .env
    const envPath = path.resolve(__dirname, '../.env');

    // Đọc file .env hiện tại
    fs.readFile(envPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ status: false, message: 'Error reading .env file', error: err });
        }

        // Cập nhật hoặc thêm giá trị NameNetwork vào nội dung file .env
        let updatedEnv = data.replace(/NAMENETWORK=.*/g, `NAMENETWORK=${NameNetwork}`);

        // Nếu không tìm thấy NameNetwork, thêm mới
        if (!/NAMENETWORK=/.test(data)) {
            updatedEnv += `\nNAMENETWORK=${NameNetwork}`;
        }

        // Ghi nội dung mới vào file .env
        fs.writeFile(envPath, updatedEnv, 'utf8', (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error writing .env file', error: err });
            }
            
            // Nạp lại biến môi trường sau khi cập nhật
            reloadEnv();  

            // Cập nhật giá trị trong process.env
            process.env.NAMENETWORK = NameNetwork;

            return res.status(200).json({ status: true, message: 'NameNetwork updated successfully', NameNetwork });
        });
    });
};

// Hàm triển khai Chaincode
exports.deployChaincode = async (req, res) => {
    const networkScriptPath = path.resolve(__dirname, '../../network/network.sh');
    const networkDirPath = path.resolve(__dirname, '../../network');
    reloadEnv();  // Nạp lại biến môi trường sau khi cập nhật .env
    const NameNetworkValue = process.env.NAMENETWORK;
    // Định nghĩa các chaincode cố định cần triển khai
    const chaincodes = [
        { chaincodeName: 'organization', chaincodePath: '../chaincode/OrgChaincode' },
        { chaincodeName: 'medical', chaincodePath: '../chaincode/MedicaChaincode' }
    ];

    let deploymentStatus = {
        success: true, // Đặt giá trị mặc định là true
        deployedChaincodes: []
    };

    try {
        for (const { chaincodeName, chaincodePath } of chaincodes) {
            console.log(`Đang triển khai chaincode ${chaincodeName}...`);


            const stdout = await new Promise((resolve, reject) => {
                exec(`cd ${networkDirPath} && bash ${networkScriptPath} deployCC -ccn ${chaincodeName} -ccp ${chaincodePath} -ccl javascript -c ${NameNetworkValue}`,
                    (error, stdout, stderr) => {
                        if (error) {
                            
                            return reject(`Lỗi khi triển khai chaincode ${chaincodeName}: ${error.message}`);
                        }
                        if (stderr && stderr.trim()) {
                            console.error(`Cảnh báo khi triển khai chaincode ${chaincodeName}: ${stderr}`);
                        }
                        resolve(stdout);
                    });
            });
            const enrollAdminss = await enrollAdmin();
            if (enrollAdminss) {
                try {
                    await registerUser();
                } catch (error) {
                    console.error("Error while registering user:", error);
                }
            } else {
                console.log("Admin enrollment failed.");
            }
            
            console.log(stdout); // In ra kết quả của lệnh nếu cần thiết

            // Đánh dấu status true nếu triển khai thành công, false nếu có lỗi
            const isSuccess = !stdout.includes('Error'); // Kiểm tra nếu stdout có chứa "Error"
            deploymentStatus.deployedChaincodes.push({
                chaincodeName,
                status: isSuccess, // true nếu thành công, false nếu có lỗi
                output: stdout
            });

            // Nếu có bất kỳ chaincode nào bị lỗi, cập nhật success = false
            if (!isSuccess) {
                deploymentStatus.success = false;
            }
        }

        // Trả về status thành công nếu tất cả chaincode đều triển khai thành công
        res.status(200).json({
            message: "Cả hai chaincode đã được triển khai thành công!",
            status: true,
            deploymentStatus
        });
    } catch (error) {
        // Nếu có lỗi, cập nhật status là thất bại
        deploymentStatus.success = false;
        deploymentStatus.errorMessage = error.message;

        console.error(error);
        res.status(500).json({
            message: error.message,
            status: false,
            deploymentStatus
        });
    }
};

