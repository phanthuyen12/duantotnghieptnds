// middlewares/authAdmin.js
module.exports = (req, res, next) => {
    const user = req.user; // Giả sử bạn lưu thông tin người dùng đã được xác thực trong req.user sau khi đăng nhập
  
    if (!user) {
      return res.status(401).json({ message: 'You need to login first.' });
    }
  
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not have permission to access this resource.' });
    }
  
    next(); // Cho phép tiếp tục nếu là admin
  };
  