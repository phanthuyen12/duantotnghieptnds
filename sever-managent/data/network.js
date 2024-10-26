const { Level } = require('level');

// Tạo các cơ sở dữ liệu cho người dùng, sản phẩm và danh mục
const networkDB = new Level('datanetwork', { valueEncoding: 'json' });


module.exports = { networkDB };
