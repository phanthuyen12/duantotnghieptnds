const userModel = require('../model/userModel');
const userView = require('../userView/userView');
const jwt = require('jsonwebtoken');

class UserController {
    async createUser(req, res) {
        const { username, name, age, password } = req.body;
        
        try {
          await userModel.addUser(username, { name, age, password });
          userView.showSuccess(res, `User ${username} added successfully.`);
        } catch (error) {
          if (error.message === 'User already exists. Cannot add more users.') {
            userView.showError(res, 'Only one user (admin) is allowed in the system.');
          } else {
            userView.showError(res, 'An error occurred while creating the user.');
          }
        }
      }
      
  async getUser(req, res) {
    const { username } = req.params;
    try {
      const user = await userModel.getUser(username);
      userView.showUser(res, user);
    } catch (error) {
      userView.showError(res, `User ${username} not found.`);
    }
  }

  async getAllUsers(req, res) {
    const users = await userModel.getAllUsers();
    userView.showAllUsers(res, users);
  }

  // Thêm hàm login
  async loginUser(req, res) {
    const { username, password } = req.body;
    const user = await userModel.verifyUser(username, password);
    const token = jwt.sign(
      { user},  // Payload
      'ee2de3938caccb365423140f03873e7b3f2032696632c594131835fe88db55f76f5580f678835c22b578de32cc7ec35d9f0a42a65dec98a839625b5611296e70',  // Secret key to sign the token (should be stored securely)
      { expiresIn: '1h' }  // Optional: token expiration time
    );
    if (user) {
      userView.showSuccess(res, {
          status: 200,  // Trạng thái thành công
          message: `Login successful. Welcome, ${user.name}!`,
          token: token
      });
  } else {
      userView.showError(res, {
          status: 401,  // Trạng thái không được phép
          message: 'Invalid username or password.'
      });
  }
  }
}

module.exports = new UserController();
