const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

class OrgChaincode extends Contract {

  // Khởi tạo ledger với dữ liệu mẫu
  async initLedger(ctx) {
    const organizations = [{
      nameorg: "hostbenh",
      nameadmin: 'phangiathuyen',
      emailadmin: 'thuyendi2004@gmail.com',
      addressadmin: '48/5btokyquan12',
      phoneadmin: '0869895748',
      businessBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAADTz',
      tokeorg: 'orgToken123',
      statusOrg: 'false',
      hospitalbranch: [],
      users: [
        {
          fullname: 'thuyendi2004@gmail',
          address: '48/5btokyquan12',
          organizationalvalue: '432545354',
          phone: '0869895748',
          typeusers: 'admin',
          branch:'sdfsdfsdf',
          imgidentification:'sdfiughys89dfy9sd8sdfsdfds',
          cccd: '0869895748',
          password: 'djfhdkjfhdfkjg',
          tokenuser: 'sdfhsdfkjhsfkjhs8437sdjkfksdfh',
          timecreats: 'sdfhsdfkjhsfkjhs8437sdjkfksdfh',
          historyUser: [],
        }
      ],
      historyOrg: [] // Thêm trường lịch sử cho tổ chức
    }];

    for (let i = 0; i < organizations.length; i++) {
      const org = organizations[i];
      const publicOrg = {
        nameadmin: org.nameadmin,
        emailadmin: org.emailadmin,
        addressadmin: org.addressadmin,
        phoneadmin: org.phoneadmin,
        tokeorg: org.tokeorg,
        historyOrg: []
      };
      await ctx.stub.putState(org.tokeorg, Buffer.from(JSON.stringify(publicOrg)));
      console.log('Added organization:', publicOrg);
    }
  }
  
  async getFullHospitalBranches(ctx, tokeorg) {
    // Lấy trạng thái của tổ chức từ state database bằng mã token
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    
    // Kiểm tra nếu không tìm thấy tổ chức với mã token
    if (!orgAsBytes || orgAsBytes.length === 0) {
        throw new Error(`Organization with token ${tokeorg} does not exist`);
    }

    // Chuyển đổi dữ liệu tổ chức từ bytes sang đối tượng JSON
    const org = JSON.parse(orgAsBytes.toString());

    // Kiểm tra và lấy danh sách bệnh viện
    const hospitalBranches = org.hospitalbranch || [];

    // Trả về danh sách bệnh viện
    return hospitalBranches;
}
  async getBranchDetails(ctx, tokeorg,tokenbrach){
    const orgbytes = await ctx.stub.getState(tokeorg);
    if(!orgbytes || orgbytes.length===0){
      throw new Error(`Organization with token ${tokeorg} does not exist`);
    }
    const org = JSON.parse(orgbytes.toString());
    const branch = org.hospitalbranch.find(item=>item.tokenbrach === tokenbrach)
    if (!branch) {
      throw new Error(`Branch with token ${tokenbranches} does not exist in organization ${tokeorg}`);
  }
  return branch;

  }

 
  async createOrganization(ctx, currentTime, nameorg, nameadmin, emailadmin, addressadmin, cccdadmin, phoneadmin, passwordadmin, businessBase64) {
    const txId = ctx.stub.getTxID();
    const tokeorg = this.hasDataToken(nameorg, txId);

    const orgExists = await this.organizationExists(ctx, tokeorg);
    if (orgExists) {
        throw new Error(`Organization with token ${tokeorg} already exists`);
    }

    const organization = {
        nameorg,
        nameadmin,
        emailadmin,
        addressadmin,
        phoneadmin,
        businessBase64,
        timestamp: currentTime,
        hospitalbranch: [],
        tokeorg: tokeorg,
        statusOrg: 'false',
        users: [],
        historyOrg: [] // Initial history for the organization
    };

    organization.historyOrg.push({
        action: 'CREATE_ORG',
        timestamporg: currentTime,
        data: { nameorg, nameadmin, emailadmin, addressadmin, phoneadmin, businessBase64 }
    });

    const collectionName = `myPrivateCollection_Org1`;
    await ctx.stub.putPrivateData(collectionName, tokeorg, Buffer.from(JSON.stringify(organization)));

    // Lưu token vào biến datahospital
    const hospitalKey = 'datahospital';
    let hospitalTokensBuffer = await ctx.stub.getPrivateData(collectionName, hospitalKey);
    let hospitalTokens = [];

    if (hospitalTokensBuffer && hospitalTokensBuffer.length > 0) {
        hospitalTokens = JSON.parse(hospitalTokensBuffer.toString());
    }

    // Thêm token mới vào danh sách
    hospitalTokens.push(tokeorg);
    await ctx.stub.putPrivateData(collectionName, hospitalKey, Buffer.from(JSON.stringify(hospitalTokens)));

    console.log(`Organization ${nameorg} created with admin ${nameadmin}`);
    return tokeorg;
}


async createAdmin(ctx, tokeorg, fullname, address, phone, cccd, password, organizationalvalue) {
  const txId = ctx.stub.getTxID();
  const tokenuser = this.hasDataToken(fullname, txId);
  const collectionName = `myPrivateCollection_Org1`; 

  // Sử dụng getPrivateData để lấy dữ liệu của tổ chức
  const orgAsBytes = await ctx.stub.getPrivateData(collectionName, tokeorg);
  if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Organization with token ${tokeorg} does not exist`);
  }

  const org = JSON.parse(orgAsBytes.toString());

  // Consider hashing the password for security

  const newUser = {
      fullname,
      address,
      phone,
      typeusers: 'superadmin',
      cccd,
      password, // Store the hashed password
      organizationalvalue,
      tokenuser,
      historyUser: []
  };

  newUser.historyUser.push({
      action: 'CREATE_USER',
      data: { fullname, address, phone, typeusers: 'admin', cccd }
  });

  org.users.push(newUser);

  org.historyOrg.push({
      action: 'ADD_USER',
      data: { fullname, tokenuser }
  });

  await ctx.stub.putPrivateData(collectionName, tokeorg, Buffer.from(JSON.stringify(org)));
  console.log(`Admin ${fullname} created in organization ${tokeorg}`);
  return tokenuser;
}

  async getfunOrganizations(ctx) {
    const collectionName = `myPrivateCollection_Org1`; // Tên của collection riêng tư
    const activeOrgs = [];
    
    // Lấy tất cả các token của tổ chức (giả sử bạn đã lưu chúng trong ledger riêng tư)
    const iterator = await ctx.stub.getPrivateDataByRangeByRange(collectionName, '', ''); // Lấy tất cả mục từ collection

    // Duyệt qua các mục
    while (true) {
        const res = await iterator.next();
        if (res.done) {
            break;
        }

        const value = res.value.value.toString('utf8');
        const org = JSON.parse(value);

        // Thêm toàn bộ dữ liệu tổ chức vào danh sách
        activeOrgs.push(org);
    }

    // Đóng iterator
    await iterator.close();

    return activeOrgs; // Trả về toàn bộ dữ liệu tổ chức
}

  async createrdetailbranch(ctx, tokeorg, branchname, branchaddress, branchphone, branchemail, branchbusinesslicense, timecreate) {
    // Lấy dữ liệu tổ chức theo token
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Tổ chức với token ${tokeorg} không tồn tại`);
    }
  
    // Tạo token chi nhánh
    const tokenbrach = this.hasDataToken(branchname, tokeorg);
  
    // Parse dữ liệu tổ chức
    const org = JSON.parse(orgAsBytes.toString());
  
    // Tạo chi nhánh mới
    const newbranch = {
      tokenbrach,
      branchname,
      branchaddress,
      branchphone,
      branchemail,
      branchbusinesslicense,
      timecreate,
      recordstatus:[],
    };
  
    // Thêm lịch sử tạo chi nhánh
    org.historyOrg.push({
      action: 'CREATE_BRANCH',
      timestamp: timecreate,
      data: newbranch
    });
  
    // Thêm chi nhánh vào tổ chức
    org.hospitalbranch.push(newbranch);
  
    // Cập nhật lại trạng thái của tổ chức
    await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(org)));
  
    console.log(`Chi nhánh ${branchname} được tạo với token ${tokenbrach} trong tổ chức ${tokeorg}`);
  
    return tokenbrach;
  }
  async addRecordStatusBranch(ctx, tokeorg, brach, cccd, content, timerequest) {
    // Lấy thông tin tổ chức (org) dựa trên token tổ chức (tokeorg)
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Tổ chức với token ${tokeorg} không tồn tại`);
    }

    // Chuyển đổi dữ liệu tổ chức từ bytes thành đối tượng JSON
    const org = JSON.parse(orgAsBytes.toString());

    // Tìm kiếm branch dựa trên tokenbranch
    const branch = org.branches.find(b => b.token === brach);
    if (!branch) {
        throw new Error(`Chi nhánh với token ${brach} không tồn tại trong tổ chức ${tokeorg}`);
    }

    // Thêm bản ghi vào mảng recordstatus[] của chi nhánh
    const newRecord = {
        cccd: cccd,
        content: content,
        timerequest: timerequest,
        status: "pending" // Hoặc bất kỳ trạng thái mặc định nào
    };
    

    // Thêm bản ghi mới vào mảng
    branch.recordstatus.push(newRecord);

    // Cập nhật lại thông tin tổ chức với bản ghi mới
    await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(org)));

    return `Bản ghi đã được thêm vào chi nhánh với token ${tokenbrach} trong tổ chức ${tokeorg}`;
}

  // Đăng nhập người dùng vào tổ chức
  async loginOrganization(ctx, tokeorg, cccd) {
    // Lấy thông tin của tổ chức dựa trên token (tokeorg)
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Tổ chức với token ${tokeorg} không tồn tại`);
    }

    // Phân tích chi tiết tổ chức
    const org = JSON.parse(orgAsBytes.toString());

    // Tìm kiếm người dùng dựa trên cccd
    const user = org.users.find(user => user.cccd === cccd);

    if (!user) {
      throw new Error('Người dùng không tồn tại trong tổ chức này');
    }

    // Trả về thông tin người dùng mà không thực hiện xác thực mật khẩu trong chaincode
    return {
      message: `Thông tin người dùng: ${user.fullname}`,
      tokenuser: user.tokenuser,  // Token này có thể dùng cho phiên hoặc xác thực JWT
      typeusers: user.typeusers,
      branch: user.branch,
      nameorg: org.nameorg,
      tokeorg: org.tokeorg,
      passwordvalue: user.password,
    };
  }

  async createpersonnel(ctx, tokeorg, branch, fullname, address, phone, typeusers, cccd, password, imgidentification, timecreats) {
    try {
      const txId = ctx.stub.getTxID();
      const tokenuser = this.hasDataToken(fullname, txId);  // Giả sử là đồng bộ. Nếu không, cần sử dụng await.
  
      // Lấy thông tin tổ chức từ ledger
      const orgAsBytes = await ctx.stub.getState(tokeorg);
      if (!orgAsBytes || orgAsBytes.length === 0) {
        throw new Error(`Organization with token ${tokeorg} does not exist`);
      }
  
      const org = JSON.parse(orgAsBytes.toString());
  
      // Kiểm tra và khởi tạo mảng nếu cần
      org.users = org.users || [];
      org.historyOrg = org.historyOrg || [];
  
      // Tạo người dùng mới
      const newUser = {
        fullname,
        address,
        phone,
        typeusers,
        cccd,
        password,
        imgidentification,
        branch,
        timecreats,
        tokenuser,
        historyUser: []  // Khởi tạo lịch sử người dùng mới
      };
  
      // Thêm lịch sử cho người dùng mới
      newUser.historyUser.push({
        action: 'CREATE_USER',
        timestamp: timecreats,
        data: { fullname, address, phone, typeusers, cccd }
      });
  
      // Thêm người dùng mới vào danh sách người dùng của tổ chức
      org.users.push(newUser);
  
      // Thêm lịch sử cho tổ chức
      org.historyOrg.push({
        action: 'ADD_USER',
        timestamp: timecreats,
        data: { fullname, tokenuser }
      });
  
      // Lưu lại trạng thái của tổ chức
      await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(org)));
  
      console.log(`User ${fullname} created in organization ${tokeorg}`);
      return tokenuser;
  
    } catch (error) {
      console.error(`Failed to create user: ${error.message}`);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }
  
  async getfullpersonnel(ctx,tokeorg){
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
        throw new Error(`Organization with token ${tokeorg} does not exist`);
    }

    // Chuyển đổi dữ liệu từ bytes sang JSON
    const organization = JSON.parse(orgAsBytes.toString());

    // Trả về danh sách users của tổ chức
    return organization.users;
  }

  async updateOrganizationStatus(ctx, tokeorg, newStatus, currentTime) {
    // Retrieve the organization state by token
    const orgAsBytes = await ctx.stub.getState(tokeorg);

    // Check if organization exists
    if (!orgAsBytes || orgAsBytes.length === 0) {
        throw new Error(`Organization with token ${tokeorg} does not exist`);
    }

    let org;
    // Try parsing the organization data from the ledger
    try {
        org = JSON.parse(orgAsBytes.toString());
    } catch (error) {
        throw new Error(`Failed to parse organization data for token ${tokeorg}: ${error}`);
    }

    // Ensure statusOrg property exists or set default
    const currentStatus = org.statusOrg || "false";  // Default to "false" if not available
    console.log(`Updating status of organization ${tokeorg} from ${currentStatus} to ${newStatus}`);

    // Update the organization's status
    org.statusOrg = newStatus;

    // Ensure historyOrg array exists before adding history entry
    if (!org.historyOrg) {
        org.historyOrg = [];
    }

    // Add history entry for the status update
    org.historyOrg.push({
        action: 'UPDATE_STATUS',
        timestamp: currentTime,
        data: { previousStatus: currentStatus, newStatus }
    });

    // Save the updated organization state back to the ledger
    try {
      const collectionName = `myPrivateCollection_Org1`; // Sử dụng dấu backticks
        await ctx.stub.putPrivateData(collectionName,tokeorg, Buffer.from(JSON.stringify(org)));
    } catch (error) {
        throw new Error(`Failed to update organization status for token ${tokeorg}: ${error}`);
    }

    // Return confirmation or updated organization data
    return {
        orgToken: tokeorg,
        status: newStatus,
        message: `Organization status updated successfully`
    };
}

  // Cập nhật thông tin người dùng
  async updateUser(ctx, tokenorg, cccd, fullname, address, phone, typeusers, password) {
    const orgAsBytes = await ctx.stub.getState(tokenorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Organization with token ${tokenorg} does not exist`);
    }

    const org = JSON.parse(orgAsBytes.toString());

    const user = org.users.find(user => user.cccd === cccd);
    if (!user) {
      throw new Error(`User with cccd ${cccd} not found`);
    }

    user.fullname = fullname;
    user.address = address;
    user.phone = phone;
    user.typeusers = typeusers;
    user.password = password;

    user.historyUser.push({
      action: 'UPDATE_USER',
      timestamp: new Date().toISOString(),
      updatedFields: { fullname, address, phone, typeusers, password }
    });

    await ctx.stub.putState(tokenorg, Buffer.from(JSON.stringify(org)));
    console.log(`User ${cccd} updated in organization ${tokenorg}`);
  }

  // Kiểm tra quyền admin
  async checkroleAdmin(ctx) {
    const clientMSPID = ctx.clientIdentity.getMSPID();

    if (clientMSPID === 'Org1MSP') {
      return true;
    } else {
      return false;
    }
  }

  // Thêm người dùng vào tổ chức
  
  async getUserByTokeorg(ctx, tokeorg, tokenuser) {
    // Lấy dữ liệu tổ chức từ ledger
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Organization with token ${tokeorg} does not exist`);
    }
  
    // Chuyển đổi dữ liệu từ bytes thành đối tượng
    const org = JSON.parse(orgAsBytes.toString());
  
    // Kiểm tra xem org là một mảng hay không
  
    // Tìm người dùng trong tổ chức dựa trên token

    const user = org.users.find(item => item.tokenuser === tokenuser);
    if (!user) {
      throw new Error('User does not exist in this organization');
    }
  
    // Trả về thông tin người dùng mà không thực hiện xác thực mật khẩu
    return user;
  }
  
  

  // Lấy thông tin tổ chức
  async getOrganization(ctx, tokeorg) {
    const collectionName = 'myPrivateCollection_Org1'; // Tên của collection chứa dữ liệu riêng tư
    const orgAsBytes = await ctx.getPrivateDataByRange(collectionName, tokeorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
        throw new Error(`Organization with token ${tokeorg} does not exist in the private collection`);
    }

    const org = JSON.parse(orgAsBytes.toString());
    const result = {
        nameorg: org.nameorg,
        nameadmin: org.nameadmin,
        emailadmin: org.emailadmin,
        addressadmin: org.addressadmin,
        phoneadmin: org.phoneadmin,
        businessBase64: org.businessBase64,
        tokeorg: org.tokeorg,
        statusOrg: org.statusOrg,
    };

    // Trả về thông tin tổ chức
    return result;
}


  // Kiểm tra tổ chức đã tồn tại chưa
  async organizationExists(ctx, tokeorg) {
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    return orgAsBytes && orgAsBytes.length > 0;
  }

  // Lấy thông tin người dùng từ tổ chức
  async getinfoUser(ctx, tokeorg, cccd) {
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Organization with token ${tokeorg} does not exist`);
    }

    const org = JSON.parse(orgAsBytes.toString());

    const user = org.users.find(user => user.cccd === cccd);
    if (!user) {
      throw new Error(`User with cccd ${cccd} not found in organization ${tokeorg}`);
    }

    return user;
  }

// Lấy toàn bộ thông tin các tổ chức
async getAllOrganizations(ctx) {
  const iterator = await ctx.stub.getPrivateDataByRangeByRange('myPrivateCollection_Org1', '', '');
  
  // Log the iterator to check its structure
  console.log("Iterator: ", iterator);

  if (!iterator || typeof iterator.next !== 'function') {
    throw new Error("Iterator is not valid or not initialized properly.");
  }

  const allResults = [];
  
  let res = await iterator.next();
  while (!res.done) {
      const record = res.value;
      console.log("Record fetched: ", record); // Log record
      if (record.value) { // Check if value exists
          allResults.push(JSON.parse(record.value.toString('utf8')));
      }
      res = await iterator.next();
  }
  
  await iterator.close(); // Always close the iterator
  return allResults;
}



async getFullDataHospital(ctx) {
  const collectionName = `myPrivateCollection_Org1`;
  const hospitalKey = 'datahospital';
  
  // Lấy danh sách token từ key 'datahospital'
  const hospitalTokensBuffer = await ctx.stub.getPrivateData(collectionName, hospitalKey);
  if (!hospitalTokensBuffer || hospitalTokensBuffer.length === 0) {
      return []; // Không có tổ chức nào
  }

  const hospitalTokens = JSON.parse(hospitalTokensBuffer.toString());
  const organizations = [];

  // Lặp qua từng token và lấy dữ liệu tổ chức tương ứng
  for (const token of hospitalTokens) {
      const orgDataBuffer = await ctx.stub.getPrivateData(collectionName, token);
      if (orgDataBuffer && orgDataBuffer.length > 0) {
          const orgData = JSON.parse(orgDataBuffer.toString());
          organizations.push(orgData);
      }
  }

  return organizations; // Trả về danh sách tổ chức
}


  //   async getActiveOrganizations(ctx) {
  //     const queryString = {
  //         selector: {
  //             statusOrg: 'true'
  //         }
  //     };

  //     const resultsIterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
  //     const organizations = [];

  //     while (true) {
  //         const res = await resultsIterator.next();

  //         if (res.value && res.value.value.toString()) {
  //             const org = JSON.parse(res.value.value.toString('utf8'));
  //             organizations.push(org);
  //         }

  //         if (res.done) {
  //             await resultsIterator.close();
  //             break;
  //         }
  //     }

  //     return organizations;
  // }

  // Hàm băm dữ liệu để tạo token, sử dụng txID để đảm bảo tính định tính
  hasDataToken(data, txId) {
    const dataWithTxId = `${data}:${txId}`;
    const hash = crypto.createHash('sha256');
    hash.update(dataWithTxId);
    return hash.digest('hex');
  }
}

module.exports = OrgChaincode;
