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
        console.log(req.body)
        if (!tokeorg) {
            return res.status(400).json({ success: false, message: 'Tokenorg is required' });
        }

        if (!value) {
            return res.status(400).json({ success: false, message: 'Value is required' });
        }

        // console.log('Request body:', req.body);
        const { contract, gateway } = await connectToNetworkorgvalue(value);
        const result = await contract.submitTransaction('getFullHospitalBranches',tokeorg);

        if (result) {
            // console.log('Transaction result:', result.toString());
            parsedResult = JSON.parse(result); // Chuyển đổi kết quả thành JSON

            res.status(200).json({ success: true ,
                data:parsedResult
            }); // Trả về true khi thành công
        } else {
            // console.error('Result is undefined');
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
exports.getHospitalBranchByIds = async (req, res) => {
    let gateway;
    try {
        const { tokeorg, value, tokenbranch } = req.body;
        console.log(req.body);      // Kết nối tới network
      const { contract, gateway :gw} = await connectToNetworkorgvalue(value);
      gateway = gw;
  
      // Gửi transaction để lấy tất cả tổ chức
      const result = await contract.submitTransaction("getHospitalBranchById",tokeorg, tokenbranch);
  
      // Kiểm tra nếu có kết quả trả về
      if (result) {
        // console.log("Transaction result:", result.toString());
  
        // Chuyển đổi chuỗi JSON thành object và trả về kết quả dưới dạng JSON
        const organizations = JSON.parse(result.toString());
        return res.status(200).json(organizations);
      } else {
        return res.status(404).json({ message: "No organizations found" });
      }
    } catch (error) {
      console.error(`Failed to submit transaction: ${error.message}`);
      return res.status(500).json({ error: `Failed to retrieve organizations: ${error.message}` });
    } finally {
      if (gateway) {
        await gateway.disconnect();
      }
    }
  };


 exports.UpdateStatusHospitalBranchByIds = async (data) => { // Chấp nhận đối tượng dữ liệu
    let gateway; // Khai báo biến gateway để sử dụng trong finally
    try {
        const { tokeorg, tokenbranch, cccd } = data; // Lấy các tham số cần thiết từ đối tượng dữ liệu
        console.log(data);      

        // Kết nối tới network
        const org = "org1"
        const { contract, gateway: gw } = await connectToNetworkorgvalue(org); // Đảm bảo rằng không có biến value chưa được định nghĩa
        gateway = gw;

        const newTimerequest = new Date();
        const newstatus = "true";

        // Gửi transaction để cập nhật trạng thái
        const result = await contract.submitTransaction("updateRecordStatusBranch", tokeorg, tokenbranch, cccd, newstatus, newTimerequest);

        // Kiểm tra nếu có kết quả trả về
        if (result) {
            console.log('Transaction result:', result.toString());

            const organizations = JSON.parse(result.toString());
            return organizations; // Hoặc bạn có thể xử lý kết quả theo cách khác
        } else {
            return null; // Nếu không có tổ chức nào được tìm thấy
        }
    } catch (error) {
        console.error(`Failed to submit transaction: ${error.message}`);
        throw new Error(`Failed to retrieve organizations: ${error.message}`); // Ném lỗi để có thể xử lý bên ngoài
    } finally {
        if (gateway) {
            await gateway.disconnect(); // Đảm bảo đóng gateway trong finally
        }
    }
};




exports.getpersonnelBytoken = async (req, res) => {
    try {
        const { tokeorg, value, tokenuser } = req.body;
        console.log(req.body);
        
        if (!tokeorg || !tokenuser) {
            return res.status(400).json({ success: false, message: 'Tokenorg and tokenuser are required' });
        }

        // console.log('Request body:', req.body);

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