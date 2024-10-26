const { userDB } = require('../data/data');
const bcrypt = require('bcrypt'); // Thêm bcrypt để mã hóa mật khẩu

class UserModel {
    async addUser(username, data) {
        // Kiểm tra nếu đã có người dùng trong hệ thống
        const usersCount = await this.getUsersCount();
        if (usersCount > 0) {
          throw new Error('User already exists. Cannot add more users.');
        }
        
        // Nếu chưa có người dùng, gán quyền admin
        data.role = 'admin';
        
        // Mã hóa mật khẩu trước khi lưu
        const salt = await bcrypt.genSalt(10);
        data.password = await bcrypt.hash(data.password, salt);
        
        // Lưu người dùng vào database
        await userDB.put(username, data);
      }
      

  async getUser(username) {
    return await userDB.get(username);
  }

  async getAllUsers() {
    const users = [];
    for await (const [key, value] of userDB.iterator({ gt: '' })) {
      users.push({ username: key, ...value });
    }
    return users;
  }

  async getUsersCount() {
    let count = 0;
    for await (const _ of userDB.iterator({ gt: '' })) {
      count++;
    }
    return count;
  }

  // Hàm verifyUser cho chức năng login
  async verifyUser(username, password) {
    try {
      const user = await this.getUser(username);
      const isMatch = await bcrypt.compare(password, user.password);
      return isMatch ? user : null;
    } catch (error) {
      return null;
    }
  }
}

module.exports = new UserModel();
