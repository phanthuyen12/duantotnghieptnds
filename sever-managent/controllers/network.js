const path = require("path");
const fs = require("fs");
const { Gateway, Wallets } = require("fabric-network");
require('dotenv').config(); // Đọc file .env để nạp biến môi trường

// Lấy giá trị từ biến môi trường
const NameNetworkValue = process.env.NAMENETWORK || "channel1";  // Nếu không có biến NAMENETWORK, mặc định là "channel1"

// Tạo hàm kết nối với mạng Medical
async function connectToNetworkmedical() {
  const ccpPath = path.resolve(
    __dirname,
    "..",
    "..",
    "network",
    "organizations",
    "peerOrganizations",
    "org1.example.com",
    "connection-org1.json"
  );
  const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

  const walletPath = path.join(process.cwd(), "wallet");
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: "userorg1",
    discovery: { enabled: true, asLocalhost: true },
  });

  const network = await gateway.getNetwork(NameNetworkValue);  // Sử dụng giá trị từ biến môi trường
  const contract = network.getContract("medical");

  return { contract, gateway };
}

// Tạo hàm kết nối với mạng Organization
async function connectToNetworkorg() {
  const ccpPath = path.resolve(
    __dirname,
    "..",
    "..",
    "network",
    "organizations",
    "peerOrganizations",
    "org1.example.com",
    "connection-org1.json"
  );
  const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

  const walletPath = path.join(process.cwd(), "wallet");
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: "userorg1",
    discovery: { enabled: true, asLocalhost: true },
  });

  const network = await gateway.getNetwork(NameNetworkValue);  // Sử dụng giá trị từ biến môi trường
  const contract = network.getContract("organization");

  return { contract, gateway };
}

// Hàm kết nối với mạng theo tên tổ chức (dựa vào tham số giá trị dynamic)
async function connectToNetworkorgvalue(value) {
  const ccpPath = path.resolve(
    __dirname,
    "..",
    "..",
    "network",
    "organizations",
    "peerOrganizations",
    `${value}.example.com`,
    `connection-${value}.json`
  );
  const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

  const walletPath = path.join(process.cwd(), "wallet");
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: `user${value}`,
    discovery: { enabled: true, asLocalhost: true },
  });

  const network = await gateway.getNetwork(NameNetworkValue);  // Sử dụng giá trị từ biến môi trường
  const contract = network.getContract("organization");

  return { contract, gateway };
}

// Hàm kết nối với mạng medical theo tên tổ chức (dựa vào tham số giá trị dynamic)
async function connectToNetworkmedicalvalue(value) {
  const ccpPath = path.resolve(
    __dirname,
    "..",
    "..",
    "network",
    "organizations",
    "peerOrganizations",
    `${value}.example.com`,
    `connection-${value}.json`
  );
  const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

  const walletPath = path.join(process.cwd(), "wallet");
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: `user${value}`,
    discovery: { enabled: true, asLocalhost: true },
  });

  const network = await gateway.getNetwork(NameNetworkValue);  // Sử dụng giá trị từ biến môi trường
  const contract = network.getContract("medical");

  return { contract, gateway };
}

// Hàm kết nối với mạng chung
async function connectToNetwork() {
  const ccpPath = path.resolve(
    __dirname,
    "..",
    "..",
    "network",
    "organizations",
    "peerOrganizations",
    "org1.example.com",
    "connection-org1.json"
  );
  const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

  const walletPath = path.join(process.cwd(), "wallet");
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: "userorg1",
    discovery: { enabled: true, asLocalhost: true },
    eventHandlerOptions: { commitTimeout: 1020 },  // Tăng timeout cho sự kiện
  });

  const network = await gateway.getNetwork(NameNetworkValue);  // Sử dụng giá trị từ biến môi trường
  const contract = network.getContract("organization");

  return { contract, gateway };
}

module.exports = { connectToNetworkmedical, connectToNetworkorg, connectToNetworkorgvalue, connectToNetworkmedicalvalue, connectToNetwork };
