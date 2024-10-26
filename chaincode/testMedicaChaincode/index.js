'use strict';

const { Contract } = require('fabric-contract-api');

class PatientRecordContract extends Contract {

    // Khởi tạo sổ khám bệnh mới
    async createPatientRecord(ctx, patientId, name, dob, address, phone) {
        const patientRecord = {
            tokenmedical: 'P0sdfsljdfjk01',
            name: 'Nguyen Van A',
            birthDate: '1980-01-01',
            gender: 'Nam',
            email: 'phangiathuyendev@gmail.com',
            address: '123 Main St, Hanoi',
            phoneNumber: '0901234567',
            identityCard: '123456789',
            passwordmedical: '',
            cccd: '3924982758347',
            approvedOrgs: {}, // Chưa có tổ chức nào được phê duyệt quyền truy cập
            medicalRecords: [], // Chưa có hồ sơ khám bệnh
            accessRequests: {}  // Các yêu cầu truy cập từ các tổ chức
        };

        await ctx.stub.putState(patientId, Buffer.from(JSON.stringify(patientRecord)));
        return `Sổ khám bệnh cho bệnh nhân ${name} với ID ${patientId} đã được tạo thành công.`;
    }

    // Thêm hồ sơ khám bệnh mới cho bệnh nhân
    async addMedicalRecord(ctx, patientId, recordId, hospital, visitDate, diagnosis, treatment, doctor) {
        const patientRecordJSON = await ctx.stub.getState(patientId);
        if (!patientRecordJSON || patientRecordJSON.length === 0) {
            throw new Error(`Bệnh nhân với ID ${patientId} không tồn tại`);
        }

        const patientRecord = JSON.parse(patientRecordJSON.toString());

        const newMedicalRecord = {
            id: recordId,
            hospital,
            visitDate,
            diagnosis,
            treatment,
            doctor
        };

        patientRecord.medicalRecords.push(newMedicalRecord);
        await ctx.stub.putState(patientId, Buffer.from(JSON.stringify(patientRecord)));
        return `Hồ sơ khám bệnh mới đã được thêm cho bệnh nhân ${patientId}.`;
    }

    // Gửi yêu cầu truy cập đến sổ khám bệnh
    async requestAccess(ctx, patientId, orgId, reason) {
        const patientRecordJSON = await ctx.stub.getState(patientId);
        if (!patientRecordJSON || patientRecordJSON.length === 0) {
            throw new Error(`Bệnh nhân với ID ${patientId} không tồn tại`);
        }

        const patientRecord = JSON.parse(patientRecordJSON.toString());

        if (!patientRecord.accessRequests[orgId]) {
            patientRecord.accessRequests[orgId] = [];
        }

        const accessRequest = {
            orgId,
            reason,
            status: 'pending'
        };

        patientRecord.accessRequests[orgId].push(accessRequest);
        await ctx.stub.putState(patientId, Buffer.from(JSON.stringify(patientRecord)));
        return `Yêu cầu truy cập từ tổ chức ${orgId} đã được gửi đến bệnh nhân ${patientId}.`;
    }

    // Phê duyệt hoặc từ chối yêu cầu truy cập
    async approveAccessRequest(ctx, patientId, orgId, recordIds, isApproved) {
        const patientRecordJSON = await ctx.stub.getState(patientId);
        if (!patientRecordJSON || patientRecordJSON.length === 0) {
            throw new Error(`Bệnh nhân với ID ${patientId} không tồn tại`);
        }

        const patientRecord = JSON.parse(patientRecordJSON.toString());

        if (!patientRecord.accessRequests[orgId] || patientRecord.accessRequests[orgId].length === 0) {
            throw new Error(`Không có yêu cầu truy cập từ tổ chức ${orgId}.`);
        }

        // Cập nhật trạng thái của yêu cầu truy cập
        const accessRequest = patientRecord.accessRequests[orgId].find(req => req.status === 'pending');
        if (!accessRequest) {
            throw new Error(`Không có yêu cầu nào đang chờ xử lý từ tổ chức ${orgId}.`);
        }

        accessRequest.status = isApproved ? 'approved' : 'denied';

        if (isApproved) {
            // Thêm tổ chức vào danh sách được phê duyệt để truy cập các hồ sơ cụ thể
            if (!patientRecord.approvedOrgs[orgId]) {
                patientRecord.approvedOrgs[orgId] = [];
            }

            recordIds.forEach(recordId => {
                if (!patientRecord.approvedOrgs[orgId].includes(recordId)) {
                    patientRecord.approvedOrgs[orgId].push(recordId);
                }
            });
        }

        await ctx.stub.putState(patientId, Buffer.from(JSON.stringify(patientRecord)));
        return `Yêu cầu truy cập từ tổ chức ${orgId} đã được ${isApproved ? 'phê duyệt' : 'từ chối'}.`;
    }

    // Lấy thông tin bệnh nhân dựa trên quyền truy cập
    async getPatientInfo(ctx, patientId, orgId) {
        const patientRecordJSON = await ctx.stub.getState(patientId);
        if (!patientRecordJSON || patientRecordJSON.length === 0) {
            throw new Error(`Bệnh nhân với ID ${patientId} không tồn tại`);
        }

        const patientRecord = JSON.parse(patientRecordJSON.toString());

        // Thông tin công khai
        const patientInfo = {
            patientId: patientRecord.patientId,
            name: patientRecord.name,
            dob: patientRecord.dob,
            address: patientRecord.address,
            phone: patientRecord.phone,
            medicalRecords: [] // Mặc định không có thông tin riêng tư
        };

        // Kiểm tra quyền truy cập và trả về các hồ sơ được phê duyệt
        if (patientRecord.approvedOrgs[orgId]) {
            const approvedRecordIds = patientRecord.approvedOrgs[orgId];
            patientInfo.medicalRecords = patientRecord.medicalRecords.filter(record =>
                approvedRecordIds.includes(record.id)
            );
        }

        return patientInfo;
    }

    // Xóa bệnh nhân và tất cả thông tin liên quan
    async deletePatientRecord(ctx, patientId) {
        const patientRecordJSON = await ctx.stub.getState(patientId);
        if (!patientRecordJSON || patientRecordJSON.length === 0) {
            throw new Error(`Bệnh nhân với ID ${patientId} không tồn tại`);
        }

        await ctx.stub.deleteState(patientId);
        return `Sổ khám bệnh cho bệnh nhân với ID ${patientId} đã bị xóa.`;
    }
}

module.exports = PatientRecordContract;
