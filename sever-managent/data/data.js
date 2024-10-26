const { Level } = require('level');

// Tạo các cơ sở dữ liệu cho người dùng, sản phẩm và danh mục
const userDB = new Level('users', { valueEncoding: 'json' });


module.exports = { userDB };
