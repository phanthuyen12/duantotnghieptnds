class NetworkView {
    // Hiển thị thông báo thành công
    showSuccess(res, message, data = null) {
      res.status(200).json({
        success: true,
        message: message,
        data: data,
      });
    }
  
    // Hiển thị thông báo lỗi
    showError(res, message) {
      res.status(400).json({
        success: false,
        message: message,
      });
    }
  }
  
  module.exports = new NetworkView();
  