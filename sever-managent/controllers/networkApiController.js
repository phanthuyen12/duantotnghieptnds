const networkModel = require('../model/networkModel');
const networkView = require('../userView/networkView');  // Bạn có thể tạo một file view riêng cho network nếu cần
const jwt = require('jsonwebtoken');

class NetworkController {
  // Tạo mới một network
  async createNetwork(req, res) {
    const { networkName, status, chaincodeName } = req.body;

    try {
      const timecreate = new Date();
      await networkModel.addNetwork(networkName, { status, chaincodeName ,timecreate});
      networkView.showSuccess(res, `Network ${networkName} created successfully.`);
    } catch (error) {
      if (error.message === 'Network already exists. Cannot add a new network with the same name.') {
        networkView.showError(res, 'A network with this name already exists.');
      } else {
        networkView.showError(res, 'An error occurred while creating the network.');
      }
    }
  }

  // Cập nhật thông tin của một network
  async updateNetwork(req, res) {
    const { networkName ,status,chaincodeName} = req.body;
 
    try {
      const updatedNetwork = await networkModel.updateNetwork(networkName, { status, chaincodeName });
      networkView.showSuccess(res, `Network ${networkName} updated successfully.`, updatedNetwork);
    } catch (error) {
      networkView.showError(res, 'An error occurred while updating the network.');
    }
  }

  // Lấy thông tin của một network theo tên
  async getNetwork(req, res) {
    const { networkName } = req.params;

    try {
      const network = await networkModel.getNetwork(networkName);
      if (network) {
        networkView.showSuccess(res, `Network ${networkName} retrieved successfully.`, network);
      } else {
        networkView.showError(res, 'Network not found.');
      }
    } catch (error) {
      networkView.showError(res, 'An error occurred while retrieving the network.');
    }
  }

  // Lấy danh sách tất cả networks
  async getAllNetworks(req, res) {
    try {
      const networks = await networkModel.getAllNetworks();
      networkView.showSuccess(res, 'Networks retrieved successfully.', networks);
    } catch (error) {
      networkView.showError(res, 'An error occurred while retrieving networks.');
    }
  }
}

module.exports = new NetworkController();
