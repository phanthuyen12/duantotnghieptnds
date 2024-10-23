const express = require('express');
const router = express.Router();
require('dotenv').config(); // Đọc file .env và nạp biến môi trường trước tiên

const orgController = require('../controllers/orgController');
const meidacaController = require('../controllers/medicaConroller');
const hospitalbrachController = require('../controllers/hospitalbrach');

const interfaceController = require('../controllers/interfaceController');
const runOrgController = require('../../network/controller/runOrg');
const userController = require('../controllers/userController');
const networkApiController = require('../controllers/networkApiController');
const networkController = require('../controllers/usenetwork');
const NameNetwork = process.env.NAMENETWORK;

router.post('/creater-org', orgController.createOrg);
router.post('/users/create', userController.createUser);

router.post('/users/login', userController.loginUser);



router.post('/getinfo-org', orgController.getorginformation);
router.post('/getall-org', orgController.getAllOrganizations);

router.post('/create-user', orgController.Createuser);
router.post('/login-org', orgController.loginorganization);
router.post('/update-user', orgController.updateUser);
router.post('/getinfo-user', orgController.getinfoUser);
router.post('/creater-org-folders', runOrgController.checkroleadmin);
router.post('/checkrole', orgController.checkroleadmin);
router.get('/show-all-org', orgController.getActiveOrganizations);
router.post('/create-brach', hospitalbrachController.create_brach);
router.post('/getfull-brach', hospitalbrachController.getFull_brach);
router.post('/getfull-personnel', hospitalbrachController.getFull_personnel);
router.post('/getpersonnel-bytoken', hospitalbrachController.getpersonnelBytoken);


router.post('/network-stop', networkController.closeNetwork);
router.post('/network-up', networkController.openNetwork);
router.post('/update-network', networkController.updateNetwork);
router.post('/deloychaincode', networkController.deployChaincode);


router.post('/request-record',meidacaController.requestbookaccess);
router.post('/approveaccess-record',meidacaController.approveAccess);
router.post('/hasaccess-record',meidacaController.hasAccess);

router.post('/create-record', meidacaController.createrecord);
router.post('/getinfo-record', meidacaController.getDataRecord);
router.post('/getfull-record', meidacaController.getfullRecords);
router.post('/getfull-accessRequests', meidacaController.getFunaccessRequests);
router.post('/register-record', meidacaController.registerMedical);
router.post('/login-record', meidacaController.loginmedical);
router.post('/update-record', meidacaController.updateRecords);
router.post('/approve-access-request', meidacaController.approveAccessRequest);


router.post('/networkapi/create', networkApiController.createNetwork);
router.get('/networkapi/get', networkApiController.getAllNetworks);
router.post('/networkapi/update', networkApiController.updateNetwork);



// Route để đăng nhập
router.post('/login', userController.loginUser);
// router.get('/interface-options',interfaceController.index);
// router.get('/list-options',interfaceController.index);



router.get('/index', (req, res) => {
    res.json({ message: 'Xin chào các bạn!' });
});

module.exports = router;