const path = require("path");
const fs = require("fs");
const { Gateway, Wallets } = require("fabric-network");
const { exec } = require('child_process');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { connectToNetworkorgvalue ,connectToNetworkorg,connectToNetwork} = require('../controllers/network');


exports.getAllOrganizations = async (req, res) => {
  let gateway;
  try {
    const value="org1" 
    // Kết nối tới network
    const { contract, gateway :gw} = await connectToNetworkorgvalue(value);
    gateway = gw;

    // Gửi transaction để lấy tất cả tổ chức
    const result = await contract.submitTransaction("getfunOrganizations");

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
exports.getAllOrganizationsToken = async (req, res) => {
  let gateway;
  try {
    const value="org1" 
    // Kết nối tới network
    const { contract, gateway :gw} = await connectToNetworkorgvalue(value);
    gateway = gw;

    // Gửi transaction để lấy tất cả tổ chức
    const result = await contract.submitTransaction("getFullDataHospital");

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
exports.checkroleadmin = async (req, res) => {
  // let gateway;
  try {
    const { contract, gateway: gw } = await connectToNetwork();
    gateway = gw;

    const result = await contract.submitTransaction("checkroleAdmin");

    if (result) {
      // console.log("Transaction result:", result.toString());

      const isAdmin = result.toString().toLowerCase() === 'true';

      if (isAdmin) {
        const { nameorg } = req.body;

        if (!nameorg) {
          return res.status(400).send("Invalid input");
        }

        const currentDirectory = process.cwd();
        const parentDirectory = path.join(currentDirectory, '../', 'network');

        // console.log(`Current Directory: ${currentDirectory}`);
        // console.log(`Parent Directory: ${parentDirectory}`);

        const scriptPath = path.join(parentDirectory, 'tudong.sh');

        exec(`sh ${scriptPath} ${nameorg}`, (error, stdout, stderr) => {
          if (error) {
            // console.error(`Error executing script: ${error.message}`);
            return res.status(500).send(`Error executing script: ${error.message}`);
          }
          if (stderr) {
            console.error(`Script stderr: ${stderr}`);
            return res.status(500).send(`Script stderr: ${stderr}`);
          }

          console.log(`Script stdout: ${stdout}`);
          return res.send(`Script executed successfully: ${stdout}`);
        });

      } else {
        return res.status(403).json({
          message: "User is not an admin",
          result: result.toString(),
        });
      }
    } else {
      console.error("Result is undefined");
      return res.status(500).send("Unexpected result from transaction");
    }
  } catch (error) {
    console.error(`Failed to submit transaction: ${error.message}`);
    return res.status(500).send(`Failed to add organization: ${error.message}`);
  } finally {
    if (gateway) {
      await gateway.disconnect();
    }
  }
};

exports.getorginformation = async (req, res) => {
  const { tokenorg } = req.body;
  console.log(req.body);
  if (!tokenorg) {
    return res.status(400).send("Invalid input");
  }
  try {
    const { contract, gateway } = await connectToNetwork();
    const result = await contract.submitTransaction(
      "getOrganization",
      tokenorg
    );
    if (result) {
      console.log("Transaction result:", result.toString());
      const org = JSON.parse(result.toString());

      res.status(200).json({
          message: "Organization has been added",
          result: org
      });
      
      
    } else {
        console.error("Result is undefined");
        res.status(500).send("Unexpected result from transaction");
    }
    await gateway.disconnect();
    
  } catch (error) {
    console.error(`Failed to submit transaction: ${error.message}`);
    res.status(500).send(`Failed to add organization: ${error.message}`);
  }
};
exports.setupOrganizationFolders = async (req, res) => {
  const { nameorg } = req.body;

  if (!nameorg) {
    return res.status(400).send("Invalid input");
  }

  try {
    // Lấy thư mục hiện tại mà Node.js đang chạy
    const currentDirectory = process.cwd();
    const parentDirectory = path.join(currentDirectory, '../', 'network');

    console.log(`Current Directory: ${currentDirectory}`);
    console.log(`Parent Directory: ${parentDirectory}`);

    const scriptPath = path.join(parentDirectory, 'tudong.sh');

    exec(`bash ${scriptPath} ${nameorg}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${error.message}`);
        return res.status(500).send(`Error executing script: ${error.message}`);
      }
      if (stderr) {
        console.error(`Script stderr: ${stderr}`);
        return res.status(500).send(`Script stderr: ${stderr}`);
      }

      console.log(`Script stdout: ${stdout}`);
      res.send(`Script executed successfully: ${stdout}`);
    });
  } catch (error) {
    console.error(`Failed to submit transaction: ${error.message}`);
    res.status(500).send(`Failed to add organization: ${error.message}`);
  }
};
exports.getActiveOrganizations = async (req, res) => {
  try {
    // Kết nối tới mạng
    const { contract, gateway } = await connectToNetwork();

    // Gọi transaction
    const result = await contract.submitTransaction("getAllOrganizations");

    // Xử lý kết quả trả về
    if (result) {
      const org = JSON.parse(result.toString());
      // console.log("Transaction result:", org);
      res.status(200).json({ message: 'Data retrieved successfully', org });
    } else {
      console.error("Transaction returned undefined or null result");
      res.status(500).send("Unexpected result from transaction");
    }

    // Ngắt kết nối gateway
    await gateway.disconnect();
  } catch (error) {
    console.error(`Failed to submit transaction: ${error.message}`);
    res.status(500).send(`Failed to retrieve organizations: ${error.message}`);
  }
}

exports.createOrg = async (req, res) => {
  const {
    nameorg, nameadmin, emailadmin, addressadmin, cccdadmin,
    phoneadmin, passworkadmin, businessBase64
  } = req.body;

  console.log(req.body);

  // Kiểm tra các trường bắt buộc
  if (
    !nameorg ||
    !cccdadmin ||
    !passworkadmin ||
    !nameadmin ||
    !emailadmin ||
    !addressadmin ||
    !phoneadmin ||
    !businessBase64
  ) {
    return res.status(400).json({ success: false, message: "Invalid input" });
  }

  try {
    // Kết nối tới mạng blockchain
    const { contract, gateway } = await connectToNetwork();
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(passworkadmin, saltRounds);
    const currentTime = new Date();

    // Thực hiện giao dịch tạo tổ chức
    const result = await contract.submitTransaction(
      "createOrganization",
      currentTime,
      nameorg,
      cccdadmin,
      passworkadmin,
      nameadmin,
      emailadmin,
      addressadmin,
      phoneadmin,
      businessBase64
    );

    if (result) {
      const tokenorg = result.toString();
      await contract.submitTransaction(
        "createAdmin",
        tokenorg, nameadmin, addressadmin, phoneadmin, cccdadmin, hashedPassword, nameorg
      );

      console.log("Transaction result:", result.toString());

      // Trả về thành công với true
      res.status(200).json({ success: true, message: result.toString() });
    } else {
      console.error("Result is undefined");

      // Trả về thất bại với false
      res.status(500).json({ success: false, message: "Unexpected result from transaction" });
    }

    // Ngắt kết nối với gateway
    await gateway.disconnect();
  } catch (error) {
    console.error(`Failed to submit transaction: ${error.message}`);

    // Trả về thất bại với false và thông báo lỗi
    res.status(500).json({ success: false, message: `Failed to add organization: ${error.message}` });
  }
};

exports.loginorganization = async (req, res) => {
  let gateway;
  try {
    // Connect to the network
    const { contract, gateway: networkGateway } = await connectToNetwork();
    gateway = networkGateway;

    const { tokeorg, cccd, password } = req.body;
    console.log(req.body)

    // Validate request parameters
    if (!tokeorg || !cccd || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Invoke chaincode transaction
    const result = await contract.submitTransaction('loginOrganization', tokeorg, cccd);

    if (result && result.length > 0) {
      // Assuming result is JSON, parse it
      const org = JSON.parse(result.toString());
      console.log("Transaction result:", org.passwordvalue);
      const oldPasswordMatch = await bcrypt.compare(password, org.passwordvalue);
      if (!oldPasswordMatch) {
        throw new Error('Mật khẩu không chính xác.'+oldPasswordMatch+org.passwordvalue);
    }
    console.log(org);
    const payload = {
      tokenuser: org.tokenuser,
      tokenuser: org.tokenuser,
      nameorg: org.nameorg,
      branch: org.branch,
      tokeorg: org.tokeorg,
  
  };
  const secretKey = 'ee2de3938caccb365423140f03873e7b3f2032696632c594131835fe88db55f76f5580f678835c22b578de32cc7ec35d9f0a42a65dec98a839625b5611296e70'; // Thay thế với khóa bí mật của bạn
  const token = jwt.sign(payload, secretKey, { expiresIn: '1h' }); // Token hết hạn sau 1 giờ

  console.info(`Người dùng với email ${cccd} đã đăng nhập thành công.`);

      res.status(200).json({ message: 'Login successful', token });
    } else {
      // Handle case where result is undefined or empty
      console.error("Result is undefined or empty");
      res.status(500).json({ error: 'Unexpected result from transaction' });
    }

  } catch (error) {
    // Log detailed chaincode error
    console.error('Chaincode error:', error);
    res.status(500).json({ error: 'Failed to execute chaincode transaction', details: error.message });
  } finally {
    // Ensure gateway is disconnected if it's connected
    if (gateway) {
      await gateway.disconnect();
    }
  }
};


exports.getinfoUser = async (req, res) => {
  try {
    const { contract, gateway } = await connectToNetwork();
    const { tokeorg, cccd } = req.body;
    if (!tokeorg || !cccd ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    console.log(req.body);
    const result = await contract.submitTransaction('getinfoUser', tokeorg, cccd);
    if (result) {
      const org = JSON.parse(result.toString());
      console.log("Transaction result:", org);
      res.status(200).json({ message: 'data', org });

    } else {
      console.error("Result is undefined");
      res.status(500).json({ error: 'Unexpected result from transaction' });
    }
    await gateway.disconnect();

 
  } catch (error) {
    // Xử lý lỗi kết nối hoặc lỗi bất ngờ
    console.error('Error in loginUser handler:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}
exports.loginUser = async (req, res) => {
  try {
    // Kết nối với mạng và lấy contract
    const { contract, gateway } = await connectToNetwork();
    const { tokeorg, tokenuser, cccd } = req.body;
    console.log(req.body);

    // Kiểm tra các trường dữ liệu
    if (!tokeorg || !cccd || !tokenuser) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      // Thực hiện giao dịch chaincode
      const result = await contract.submitTransaction('loginUser', tokeorg, tokenuser, cccd);

      // Xử lý kết quả giao dịch
      if (result) {
        const org = JSON.parse(result.toString());
        console.log("Transaction result:", org);
        res.status(200).json({ message: 'Login successful', org });
  
      } else {
        console.error("Result is undefined");
        res.status(500).json({ error: 'Unexpected result from transaction' });
      }
    } catch (chaincodeError) {
      console.error('Chaincode error:', chaincodeError);
      return res.status(500).json({ error: 'Failed to execute chaincode transaction' });
    } finally {
      // Ngắt kết nối với gateway
      await gateway.disconnect();
    }

  } catch (error) {
    // Xử lý lỗi kết nối hoặc lỗi bất ngờ
    console.error('Error in loginUser handler:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};



exports.Createuser = async (req, res) => {
  try {
    // Kết nối đến mạng và lấy contract
    const {value, tokeorg, branch, imgidentification, fullname, address, phone, typeusers, cccd, password } = req.body;
    const { contract, gateway } = await connectToNetworkorgvalue(value);

    // Lấy dữ liệu từ request body
    console.log(req.body);

    // Kiểm tra tính hợp lệ của dữ liệu
    if (!tokeorg || !fullname || !branch || !address || !imgidentification || !phone || !typeusers || !cccd || !password) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    try {
      const timecreats = new Date();
      console.log(timecreats.toISOString());
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const result = await contract.submitTransaction('createpersonnel', tokeorg, branch, fullname, address, phone, typeusers, cccd, hashedPassword, imgidentification, timecreats);

      if (result) {
        console.log("Transaction result:", result.toString());

        // Đổi tên biến để không gây xung đột
        const transactionResult = result.toString();
        return res.status(200).json({ success: true, message: 'User created successfully', result: transactionResult });

      } else {
        console.error("Result is undefined");
        return res.status(500).json({ success: false, message: 'No result from chaincode' });
      }
    } catch (chaincodeError) {
      console.error('Chaincode error:', chaincodeError);
      return res.status(500).json({
        status: false, 
        error: 'Failed to execute chaincode transaction'
      });
    }

    // Ngắt kết nối với gateway
    await gateway.disconnect();

  } catch (error) {
    // Xử lý lỗi kết nối hoặc lỗi bất ngờ
    console.error('Error in createUser handler:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

  exports.updateUser = async (req, res) => {
      // Kết nối đến mạng và lấy contract
      const { contract, gateway } = await connectToNetwork();
  
      // Lấy dữ liệu từ request body
      const { tokeorg, cccd, fullname, address, phone, typeusers, password } = req.body;
  
      // Kiểm tra tính hợp lệ của dữ liệu
      console.log(req.body);
      if (!tokeorg || !cccd || !fullname || !address || !phone || !typeusers || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
  
      // Gọi hàm updateUser trong chaincode
      try {
        await contract.submitTransaction('updateUser', tokeorg, cccd, fullname, address, phone, typeusers, password);
        console.log(`User with cccd ${cccd} updated successfully`);
  
        // Trả về phản hồi thành công
        res.status(200).json({ message: `User ${fullname} updated successfully` });
        
      } catch (chaincodeError) {
        console.error('Chaincode error:', chaincodeError);
        return res.status(500).json({ error: 'Failed to execute chaincode transaction' });
      }
  

      // Ngắt kết nối với gateway
      await gateway.disconnect();
    
  };

    exports.modelOrg = async (req, res) => {

    }
  