class UserView {
    showSuccess(res, message) {
      res.status(200).send({ success: true, message });
    }
  
    showError(res, message) {
      res.status(400).send({ success: false, message });
    }
  
    showUser(res, user) {
      res.status(200).send({ success: true, user });
    }
  
    showAllUsers(res, users) {
      res.status(200).send({ success: true, users });
    }
  }
  
  module.exports = new UserView();
  