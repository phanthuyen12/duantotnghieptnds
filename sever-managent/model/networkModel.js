// models/networkModel.js
const { networkDB } = require('../data/network');


class NetworkModel {
  // Thêm mới một network
  async addNetwork(networkName, data) {
    // Kiểm tra nếu network đã tồn tại
    const network = await this.getNetwork(networkName);
    if (network) {
      throw new Error('Network already exists. Cannot add a new network with the same name.');
    }

    // Lưu network vào cơ sở dữ liệu
    await networkDB.put(networkName, data);
  }

  // Lấy thông tin của một network
  async getNetwork(networkName) {
    try {
      return await networkDB.get(networkName); // Trả về thông tin của network nếu có
    } catch (error) {
      return null;  // Trả về null nếu không tìm thấy network
    }
  }

  // Lấy tất cả networks
  async getAllNetworks() {
    const networks = [];
    for await (const [key, value] of networkDB.iterator({ gt: '' })) {
      networks.push({ networkName: key, ...value });
    }
    return networks;
  }

  // Đếm số lượng networks
  async getNetworksCount() {
    let count = 0;
    for await (const _ of networkDB.iterator({ gt: '' })) {
      count++;
    }
    return count;
  }

  // Cập nhật thông tin của một network
  async updateNetwork(networkName, data) {
    const network = await this.getNetwork(networkName);

    if (!network) {
      throw new Error('Network not found.');
    }

    // Cập nhật dữ liệu của network
    const updatedNetwork = { ...network, ...data };

    // Lưu lại thông tin đã cập nhật
    await networkDB.put(networkName, updatedNetwork);

    return updatedNetwork;
  }
}

module.exports = new NetworkModel();
