'use strict';

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class MedicalBookContract extends Contract {

    async initLedger(ctx) {
        console.info('Khởi tạo sổ cái với dữ liệu mẫu');

        const sampleRecords = [
            {
                cccd: '3924982758347',
                tokenmedical: 'P0sdfsljdfjk01',
                name: 'Nguyen Van A',
                email: 'phangiathuyendev@gmail.com',
                birthDate: '1980-01-01',
                gender: 'Nam',
                weight: 70,   // Thêm cân nặng
                height: 175,  // Thêm chiều cao
                address: '123 Main St, Hanoi',
                phoneNumber: '0901234567',
                avatar: '123456789',
                passwordmedical: 'matkhau123',  // Thêm mật khẩu bảo vệ hồ sơ y tế
                survivalIndex: [                // Thêm thông tin về chỉ số sinh tồn
                    {
                        bloodType: 'O+',         // Nhóm máu
                        heartRate: 75,           // Nhịp tim (bpm)
                        bloodPressure: '120/80'  // Huyết áp
                    }
                ],
                medicalinsurance: 'BH123456789', // Sổ bảo hiểm y tế
                medicalHistory: [               // Lịch sử y tế (có thể thêm nhiều mục)
                    {
                        date: '2023-01-01',
                        diagnosis: 'Cảm lạnh',
                        treatment: 'Nghỉ ngơi, uống thuốc hạ sốt'
                    }
                ],
                currentStatus: {                // Trạng thái hiện tại của bệnh nhân
                    symptoms: 'Đau đầu',
                    diagnosis: 'Tăng huyết áp',
                    treatmentPlan: 'Thuốc B'
                },
                medicalExaminationHistory: [     // Lịch sử khám bệnh của bệnh nhân
                    {
                        date: '2023-05-01',
                        doctor: 'Bác sĩ B',
                        hospital: 'Bệnh viện Bạch Mai',
                        notes: 'Bệnh nhân ổn định, theo dõi huyết áp'
                    }
                ],
                accessRequests: [],              // Danh sách yêu cầu quyền truy cập
                authorizedEntities: []           // Các thực thể được phê duyệt quyền truy cập
            }
        ];
        
        for (const record of sampleRecords) {
            await ctx.stub.putState(record.cccd, Buffer.from(JSON.stringify(record)));
            console.info(`Đã thêm bản ghi với ID: ${record.cccd}`);
        }
    }
    async getAllMedicalRecords(ctx) {
        console.info('Lấy tất cả các sổ khám bệnh từ sổ cái');

        const iterator = await ctx.stub.getStateByRange('', ''); // Lấy toàn bộ dữ liệu trong range từ '' đến ''
        const allRecords = [];

        let result = await iterator.next();
        while (!result.done) {
            const recordKey = result.value.key;
            const recordValue = result.value.value.toString('utf8');

            // Parse dữ liệu JSON của bản ghi
            let record;
            try {
                record = JSON.parse(recordValue);
            } catch (err) {
                console.error(`Lỗi parse dữ liệu cho key: ${recordKey}`, err);
                record = recordValue;
            }

            allRecords.push({ Key: recordKey, Record: record });
            result = await iterator.next();
        }

        await iterator.close(); // Đảm bảo đóng iterator sau khi sử dụng

        console.info('Đã lấy xong tất cả các sổ khám bệnh.');
        return JSON.stringify(allRecords); // Trả về danh sách bản ghi dưới dạng chuỗi JSON
    }

    async createRecord(ctx, name, email, birthDate, gender, weight, height, address, phoneNumber, avatar, cccd, medicalinsurance, passwordmedical) {
        // Tạo token y tế (một mã định danh duy nhất) cho bệnh án
        const tokenmedical = this.generateToken(name);
    
        // Tạo một đối tượng bệnh án với các thông tin cơ bản
        const record = {
            tokenmedical,                // Mã token của bệnh án
            name,                        // Tên bệnh nhân
            email,                       // Email
            birthDate,                   // Ngày sinh
            gender,                      // Giới tính
            weight,                      // Cân nặng
            height,                      // Chiều cao
            address,                     // Địa chỉ
            phoneNumber,                 // Số điện thoại
            avatar,                      // Ảnh đại diện
            cccd,                        // Số CCCD (Căn cước công dân)
            passwordmedical,             // Mật khẩu bảo vệ hồ sơ y tế
            survivalIndex: [],           // Chỉ số sinh tồn (nhóm máu, nhịp tim, huyết áp)
            medicalinsurance,            // Sổ bảo hiểm y tế
            medicalHistory: [],          // Lịch sử y tế ban đầu là mảng rỗng
            currentStatus: {},           // Trạng thái hiện tại, khởi tạo rỗng
            medicalExaminationHistory: [], // Lịch sử khám bệnh
            accessRequests: [],          // Danh sách yêu cầu quyền truy cập ban đầu, khởi tạo rỗng
            authorizedEntities: []       // Các thực thể được ủy quyền ban đầu, khởi tạo rỗng
        };
    
        // Thêm sự kiện "TẠO_MEDICAL" vào lịch sử y tế
        const currentTime = new Date().toISOString(); // Lấy thời gian hiện tại
        record.medicalHistory.push({
            action: 'CREAT_MEDICAL',        // Hành động tạo hồ sơ
            timestamp: currentTime,       // Thời gian hiện tại khi hồ sơ được tạo
            data: { name, birthDate, gender, address, phoneNumber, avatar, cccd, passwordmedical } // Dữ liệu bệnh nhân
        });
    
        // Hiển thị thông tin đã tạo bệnh án với mã CCCD
        console.info(`Đã tạo bản ghi với CCCD: ${cccd}`);
    
        // Lưu bệnh án vào blockchain sử dụng CCCD làm khóa
        await ctx.stub.putState(cccd, Buffer.from(JSON.stringify(record)));
    
        // Trả về mã CCCD sau khi tạo thành công
        return cccd;
    }
    async getDataFunaccessRequests(ctx, cccd, tokenmedical) {
        // Lấy tokenmedical từ cccd
        const cccdcalAsBytes = await ctx.stub.getState(cccd);
    
        if (!cccdcalAsBytes || cccdcalAsBytes.length === 0) {
            return { 
                success: false, 
                message: `Không tìm thấy bản ghi với CCCD ${cccd}` 
            };
        }
    
        // Lấy bản ghi thực tế từ tokenmedical
        const record = JSON.parse(cccdcalAsBytes.toString());
    
        // Kiểm tra token trong bản ghi
        if (record.tokenmedical !== tokenmedical) {
            return { 
                success: false, 
                message: 'Token không hợp lệ.' 
            };
        }
    
        // Chỉ trả về tokenmedical
        return { 
            success: true, 
            message: 'Token đã được xác nhận thành công.', 
            tokenmedical: record.accessRequests // Chỉ trả về tokenmedical
        };
    }
    
    async loginMedical(ctx, cccd, passwordmedical) {
        // Lấy tất cả hồ sơ y tế
        const allRecords = await this.getAllMedicalRecords(ctx);
        const parsedRecords = JSON.parse(allRecords);
    
        // Tìm hồ sơ dựa trên cccd
        const existingRecord = parsedRecords.find(record =>
            record.Record.cccd === cccd
        );
    
        if (!existingRecord) {
            return { success: false, message: 'CCCD không tồn tại trong hệ thống.' };
        }
    
        // Kiểm tra mật khẩu (được bỏ ra ở phiên bản trước)
        // const passwordMatch = await bcrypt.compare(passwordmedical, existingRecord.Record.passwordmedical);
        // if (!passwordMatch) {
        //     return { success: false, message: 'Mật khẩu không chính xác.' };
        // }
    
        // Tạo JWT token (được bỏ ra ở phiên bản trước)
        // const payload = {
        //     tokenmedical: existingRecord.Record.tokenmedical,
        //     name: existingRecord.Record.name,
        //     email: existingRecord.Record.email,
        //     cccd: existingRecord.Record.cccd
        // };
    
        // const secretKey = 'ee2de3938caccb365423140f03873e7b3f2032696632c594131835fe88db55f76f5580f678835c22b578de32cc7ec35d9f0a42a65dec98a839625b5611296e70'; // Thay thế với khóa bí mật của bạn
        // const token = jwt.sign(payload, secretKey, { expiresIn: '1h' }); // Token hết hạn sau 1 giờ
    
        console.info(`Người dùng với CCCD ${cccd} đã đăng nhập thành công.`);
        return { 
            success: true, 
            message: 'Đăng nhập thành công.', 
            existingRecord: existingRecord.Record // Trả về thông tin hồ sơ y tế
        };  // Trả về thông tin thành công sau khi đăng nhập thành công
    }
    
    async registerMedical(ctx, name, email, cccd, passwordmedical, currentTime) {
        // Check if email or cccd already exists in the ledger
        const iterator = await ctx.stub.getStateByRange('', ''); // Retrieve all data
        let result = await iterator.next();
        while (!result.done) {
            const record = JSON.parse(result.value.value.toString('utf8'));
            if (record.email === email) {
                return { success: false, message: `Email ${email} already exists in the system.` };
            }
            if (record.cccd === cccd) {
                return { success: false, message: `CCCD ${cccd} already exists in the system.` };
            }
            result = await iterator.next();
        }
        await iterator.close(); // Ensure the iterator is closed after use
    
        // Generate a medical token based on the patient's name
        const tokenmedical = this.generateToken(name);
    
        // Create a new medical record with the essential information
        const record = {
            tokenmedical,                // Medical record token
            name,                        // Patient's name
            email,                       // Patient's email
            passwordmedical,             // Password to protect the medical record
            cccd,                        // Citizen ID
            medicalHistory: [],          // Initial empty medical history
            currentStatus: {},           // Current status, initialized as empty
            accessRequests: [],          // Initial empty access requests list
            authorizedEntities: []       // Initial empty authorized entities list
            // Other fields like weight, height, and medical insurance will be updated later
        };
    
        // Add "CREATE_MEDICAL" event to medical history
        record.medicalHistory.push({
            action: 'CREATE_MEDICAL',    // Action to create the medical record
            timestamp: currentTime,      // The current time when the record is created
            data: { name, email, passwordmedical, cccd }  // Basic patient data
        });
    
        // Save the record to the blockchain ledger
        await ctx.stub.putState(cccd, Buffer.from(JSON.stringify(record)));
    
        console.info(`Created record with ID: ${cccd}`);
        return { success: true, message: `Record created with ID: ${cccd}`, tokenmedical };  // Return the medical token and success message
    }
    

    async PostDataMedicalExaminationHistory(ctx, cccd, tokeorg, newData, timepost) {
        const recordAsBytes = await ctx.stub.getState(cccd);
        
        if (!recordAsBytes || recordAsBytes.length === 0) {
            return { success: false, message: `Record with CCCD ${cccd} does not exist` };
        }
    
        const record = JSON.parse(recordAsBytes.toString());
        const approvedRequest = record.accessRequests.find(req => req.organization === tokeorg && req.approved === "true");
    
        if (!approvedRequest) {
            return { success: false, message: `Access request from organization ${ctx.clientIdentity.getMSPID()} is not approved.` };
        }
       
        Object.keys(newData).forEach(key => {
            record[key] = newData[key]; 
        });
    
        record.medicalHistory.push({
            action: "Add medical examination data",
            timestamp: timepost,
            data: newData
        });
    
        await ctx.stub.putState(cccd, Buffer.from(JSON.stringify(record)));
        
        console.info(`Record with CCCD ${cccd} has been successfully updated`);
        return { success: true, message: `Record with CCCD ${cccd} has been successfully updated` };
    }
    
    
    async updateRecord(ctx, cccd, weight, height, medicalinsurance,  birthDate, gender, address, phoneNumber, avatar, currentTime) {
        // Retrieve the record from the ledger based on CCCD
        const recordAsBytes = await ctx.stub.getState(cccd);
        
        // Check if the record exists
        if (!recordAsBytes || recordAsBytes.length === 0) {
            return { success: false, message: `Record with CCCD ${cccd} does not exist` };
        }
        
        // Parse the existing record
        const record = JSON.parse(recordAsBytes.toString());
    
        // Update the fields with the new values
        record.weight = weight; // Update weight
        record.height = height; // Update height
        record.medicalinsurance = medicalinsurance; // Update medical insurance

        record.birthDate = birthDate; // Update birth date
        record.gender = gender; // Update gender
        record.address = address; // Update address
        record.phoneNumber = phoneNumber; // Update phone number
        record.avatar = avatar; // Update avatar
    
        // Add the "UPDATE_MEDICAL" event to the medical history
        record.medicalHistory.push({
            action: 'UPDATE_MEDICAL',    // Action to update the medical record
            timestamp: currentTime,      // The current time when the record is updated
            data: { 
                weight, 
                height, 
                medicalinsurance, 
                birthDate, 
                gender, 
                address, 
                phoneNumber, 
                avatar 
            }  // Data being updated
        });
    
        // Save the updated record back to the blockchain ledger
        const res = await ctx.stub.putState(cccd, Buffer.from(JSON.stringify(record)));
        console.log(res)
        console.info(`Record with CCCD ${cccd} has been updated.`);
        return { success: true, message: `Record with CCCD ${cccd} has been successfully updated.` };
    }
    
    async requestAccess(ctx, cccd, tokeorg, content, timerequest) {
        // Lấy bản ghi từ sổ cái
        const recordAsBytes = await ctx.stub.getState(cccd);
        const clientMSPID = ctx.clientIdentity.getMSPID();
    
        if (!recordAsBytes || recordAsBytes.length === 0) {
            return { success: false, message: `Bản ghi với ID ${cccd} không tồn tại` };

        }
    
        const record = JSON.parse(recordAsBytes.toString());
    
        // Kiểm tra xem tổ chức đã gửi yêu cầu nào chưa
        const existingRequest = record.accessRequests.find(req => req.organization === tokeorg);
        if (existingRequest) {
            return { success: false, message: `Tổ chức ${tokeorg} đã gửi yêu cầu quyền truy cập trước đó. Chỉ một yêu cầu được phép gửi.` };
        }
    
        // Thêm yêu cầu quyền truy cập vào danh sách yêu cầu với trạng thái chưa được phê duyệt
        record.accessRequests.push({
            organization: tokeorg,
            nameorganization: clientMSPID,
            content: content,
            approved: false,
            viewType: "None", // Kiểu hiển thị (ví dụ: detailed, summary)
            timestamp: timerequest
        });
    
        // Thêm vào lịch sử y tế
        record.medicalHistory.push({
            action: 'Receive requests from the organization',
            timestamp: timerequest,
            content: content,
            viewType: "None", // Kiểu hiển thị (ví dụ: detailed, summary)
            data: { tokeorg, clientMSPID }
        });
    
        // Cập nhật bản ghi trên sổ cái
        await ctx.stub.putState(cccd, Buffer.from(JSON.stringify(record)));
        console.info(`Tổ chức ${tokeorg} đã gửi yêu cầu quyền truy cập cho bản ghi với ID: ${cccd}`);
        return { success: true, message: `Yêu cầu quyền truy cập từ tổ chức ${tokeorg} đã được thêm vào bản ghi với ID: ${cccd}` };
    }
    



    async approveAccess(ctx, cccd, tokenorg) {
        // Lấy bản ghi từ sổ cái
        const recordAsBytes = await ctx.stub.getState(cccd);
        const clientMSPID = ctx.clientIdentity.getMSPID();

        if (!recordAsBytes || recordAsBytes.length === 0) {
            throw new Error(`Bản ghi với ID ${cccd} không tồn tại`);
        }

        const record = JSON.parse(recordAsBytes.toString());

        // Tìm yêu cầu quyền truy cập tương ứng với tokenorg
        let requestFound = false;
        for (let request of record.accessRequests) {
            if (request.organization === tokenorg && !request.approved) {
                // Cập nhật trạng thái phê duyệt
                request.approved = true;
                requestFound = true;

                // Thêm vào lịch sử y tế
                record.medicalHistory.push({
                    action: 'Approved access request',
                    timestamp: new Date().toISOString(),
                    data: { tokenorg, clientMSPID }
                });

                break;
            }
        }

        if (!requestFound) {
            throw new Error(`Không tìm thấy yêu cầu quyền truy cập chưa được phê duyệt từ tổ chức ${tokenorg} cho bản ghi với ID ${cccd}`);
        }

        // Cập nhật bản ghi trên sổ cái
        await ctx.stub.putState(cccd, Buffer.from(JSON.stringify(record)));
        console.info(`Tổ chức ${clientMSPID} đã phê duyệt quyền truy cập cho tổ chức ${tokenorg} đối với bản ghi với ID: ${cccd}`);
    }
    async hasAccess(ctx, tokenmedical, tokenorg) {
        // Lấy bản ghi từ sổ cái
        const recordAsBytes = await ctx.stub.getState(tokenmedical);

        if (!recordAsBytes || recordAsBytes.length === 0) {
            throw new Error(`Bản ghi với ID ${tokenmedical} không tồn tại`);
        }

        const record = JSON.parse(recordAsBytes.toString());

        // Tìm yêu cầu quyền truy cập từ tổ chức cụ thể và kiểm tra trạng thái phê duyệt
        const accessRequest = record.accessRequests.find(request =>
            request.organization === tokenorg && request.approved === true
        );

        // Kiểm tra xem tổ chức có quyền truy cập hay không
        if (accessRequest) {
            console.info(`Tổ chức ${tokenorg} có quyền truy cập vào bản ghi với ID ${tokenmedical}`);
            return {
                tokenmedical: record.tokenmedical,
                name: record.name,
                birthDate: record.birthDate,
                gender: record.gender,
                address: record.address,
                phoneNumber: record.phoneNumber,
                avatar: record.avatar,

                cccd: record.cccd
            };
        } else {
            console.info(`Tổ chức ${tokenorg} không có quyền truy cập vào bản ghi với ID ${tokenmedical}`);
            return false;
        }
    }

    async getDataRecord(ctx, cccd, tokenmedical) {
        // Lấy tokenmedical từ cccd
        const cccdcalAsBytes = await ctx.stub.getState(cccd);
    
        if (!cccdcalAsBytes || cccdcalAsBytes.length === 0) {
            return { 
                success: false, 
                message: `Không tìm thấy bản ghi với CCCD ${cccd}` 
            };
        }
    
        // Lấy bản ghi thực tế từ tokenmedical
        const record = JSON.parse(cccdcalAsBytes.toString());
    
        // Kiểm tra token trong bản ghi
        if (record.tokenmedical !== tokenmedical) {
            return { 
                success: false, 
                message: 'Token không hợp lệ.' 
            };
        }
    
        return { 
            success: true, 
            message: 'Bản ghi đã được lấy thành công.', 
            record: record 
        };
    }
    

    async approveAccessRequest(ctx, cccd, tokeorg, approve, viewType, timecreate) {
        // Lấy bản ghi từ sổ cái
        const recordAsBytes = await ctx.stub.getState(cccd);
        const clientMSPID = ctx.clientIdentity.getMSPID();
    
        if (!recordAsBytes || recordAsBytes.length === 0) {
            return { 
                success: false, 
                message: `Bản ghi với ID ${cccd} không tồn tại` 
            };
        }
    
        const record = JSON.parse(recordAsBytes.toString());
    
        // Tìm yêu cầu truy cập từ tổ chức bằng filter
        const requests = record.accessRequests.filter(req => req.organization === tokeorg);
        
        // Kiểm tra xem có yêu cầu nào không
        if (requests.length === 0) {
            return { 
                success: false, 
                message: `Không tìm thấy yêu cầu truy cập từ tổ chức ${tokeorg}` 
            };
        }
    
        // Cập nhật trạng thái phê duyệt và viewType cho từng yêu cầu truy cập
        requests.forEach(req => {
            req.approved = approve; // Cập nhật trạng thái được phê duyệt
            req.viewType = viewType; // Cập nhật viewType
        });
    
        // Thêm vào lịch sử y tế
        record.medicalHistory.push({
            action: 'successfully approved the organization',
            timestamp: timecreate,
            data: { cccd, tokeorg, approve, viewType }
        });
    
        // Cập nhật bản ghi trên sổ cái
        await ctx.stub.putState(cccd, Buffer.from(JSON.stringify(record)));
    
        return { 
            success: true, 
            message: 'Yêu cầu truy cập đã được phê duyệt thành công.', 
            approvedRequests: requests // Trả về danh sách yêu cầu truy cập đã được cập nhật
        }; 
    }
    
    
    async getMedicalRecord(ctx, cccd, tokeorg) {
        // Lấy bản ghi từ sổ cái
        const recordAsBytes = await ctx.stub.getState(cccd);
    
        if (!recordAsBytes || recordAsBytes.length === 0) {
            return { 
                success: false, 
                message: `Bản ghi với ID ${cccd} không tồn tại` 
            };
        }
    
        const record = JSON.parse(recordAsBytes.toString());
        const clientMSPID = ctx.clientIdentity.getMSPID();
    
        // Kiểm tra xem tổ chức có được phê duyệt quyền truy cập không
        if (!record.approvedOrgs[tokeorg]) {
            return { 
                success: false, 
                message: `Tổ chức ${tokeorg} chưa được phê duyệt quyền truy cập` 
            };
        }
    
        // Xác định loại quyền truy cập
        const accessType = record.approvedOrgs[tokeorg];
    
        let result;
    
        // Nếu tổ chức được phê duyệt quyền xem tất cả thông tin
        if (accessType.viewAll) {
            result = {
                cccd: record.cccd,
                tokenmedical: record.tokenmedical,
                name: record.name,
                birthDate: record.birthDate,
                gender: record.gender,
                email: record.email,
                address: record.address,
                phoneNumber: record.phoneNumber,
                avatar: record.avatar,
                medicalRecords: record.medicalRecords,
                currentStatus: record.currentStatus,
                medicalHistory: record.medicalHistory,
                accessRequests: record.accessRequests
            };
        } 
        // Nếu tổ chức chỉ được phê duyệt quyền xem thông tin hạn chế
        else if (accessType.viewLimited) {
            result = {
                cccd: record.cccd,
                tokenmedical: record.tokenmedical,
                name: record.name,
                birthDate: record.birthDate,
                gender: record.gender,
                email: record.email
            };
        } else {
            return { 
                success: false, 
                message: `Tổ chức ${tokeorg} không có quyền truy cập vào thông tin này` 
            };
        }
    
        return { 
            success: true, 
            message: 'Truy cập bản ghi thành công.', 
            data: result 
        }; // Trả về thông tin bản ghi y tế
    }
    

    generateToken(data) {
        const hash = crypto.createHash('sha256');
        hash.update(data);
        return hash.digest('hex');
    }
}

module.exports = MedicalBookContract;
