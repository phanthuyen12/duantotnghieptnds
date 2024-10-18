'use strict';

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

class MedicalBookContract extends Contract {

    async initLedger(ctx) {
        const medicalBooks = [
            {
                medicalBookId: "sdfsdfjlskdfjl",
                patientName: "phanthanhthu",
                patientYear: "11-10-2004",
                medicalHistory: [
                    {
                        doctorId: "djghfgfgjhdfkjfh",
                        hospitalId: "hkfsjdkjsfdhskdfhk",
                        appointment: "6-7-2024",
                        typeDisease: "tieuduong",
                        adminHospital: "admin1",
                    }
                ],
            }
        ];

        for (let i = 0; i < medicalBooks.length; i++) {
            await ctx.stub.putState(medicalBooks[i].medicalBookId, Buffer.from(JSON.stringify(medicalBooks[i])));
            console.log('Added medical book:', medicalBooks[i]);
        }
    }

    async createMedicalBook(ctx, doctorId, hospitalId, patientName, patientYear, appointment, typeDisease) {
        try {
            const tokenMedicalBook = this.tokenIdMedicalBook(patientName);
            const medicalBook = {
                medicalBookId: tokenMedicalBook,
                patientName,
                patientYear,
                medicalHistory: [
                    {
                        doctorId,
                        hospitalId,
                        appointment,
                        typeDisease,
                        adminHospital: ctx.clientIdentity.getID()
                    }
                ],
            };

            await ctx.stub.putState(tokenMedicalBook, Buffer.from(JSON.stringify(medicalBook)));
            console.log('Created new medical book:', medicalBook);
        } catch (error) {
            console.error('Failed to create medical book:', error);
            throw error;
        }
    }

    tokenIdMedicalBook(patientName) {
        const hash = crypto.createHash('sha256');
        hash.update(patientName);
        return hash.digest('hex');
    }

    async getMedicalBook(ctx, medicalBookId) {
        const medicalBookBytes = await ctx.stub.getState(medicalBookId);
        if (!medicalBookBytes || medicalBookBytes.length === 0) {
            throw new Error(`Medical book with ID ${medicalBookId} does not exist`);
        }
        const medicalBook = JSON.parse(medicalBookBytes.toString());
        return medicalBook;
    }
}

module.exports = MedicalBookContract;
