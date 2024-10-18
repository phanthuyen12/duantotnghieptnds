const path = require("path");
const fs = require("fs");
const { Gateway, Wallets } = require("fabric-network");
const { connectToNetwork } = require('./network'); // Chỉnh đường dẫn tùy theo cấu trúc thư mục của bạn
require('dotenv').config(); // Đọc file .env để nạp biến môi trường

// Lấy giá trị từ biến môi trường
const NameNetworkValue = process.env.NAMENETWORK || "channel1";  // Nếu không có biến NAMENETWORK, mặc định là NameNetworkValue

async function connectToNetworklist() {
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

  const network = await gateway.getNetwork(NameNetworkValue);
  const contract = network.getContract("mediaca");

  return { contract, gateway };
}

exports.listOrg = async (req, res) => {
    const { contract, gateway } = await connectToNetwork();

    console.log(model);
}
exports.index = async (req, res) => {
    const model = req.query.model;
    console.log(model);
}
