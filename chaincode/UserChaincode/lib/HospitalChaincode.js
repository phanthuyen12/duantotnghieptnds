'use strict';
const { Contract } = require('fabric-contract-api');
const crypto = require('crypto'); // Import module crypto

class HospitalContract extends Contract {
    async initLedger(ctx) {
        const hospitals = [
            {
                hospitalId: 'gfdgdfgdf6546dfdfg',
                namehospital: 'Hospital 1',
                address: 'quan 12',
                type: "kgfdjhydkfgjdfgjh",
                organization: 'Org1',
                doctors: [],
                admin: 'admin1'
            },
            {
                hospitalId: 'gfdgdfgdf6546dfdfg4544',
                namehospital: 'Hospital 2',
                address: 'quan 12',
                type: "kgfdjhydkfgjdfgjhd",
                organization: 'Org2',
                doctors: [],
                admin: 'admin2'
            }
        ];

        for (let i = 0; i < hospitals.length; i++) {
            await ctx.stub.putState(hospitals[i].hospitalId, Buffer.from(JSON.stringify(hospitals[i])));
            console.log('Added hospital:', hospitals[i]);
        }
    }

    async createHospital(ctx, type, namehospital, address, organization) {
        try {
            console.log('createHospital called with:', { type, namehospital, address, organization });
    
            let tokenhospital = this.generateToken(namehospital);
            console.log('Generated token:', tokenhospital);
    
            const hospital = {
                hospitalId: tokenhospital,
                namehospital,
                type,
                address,
                organization,
                doctors: [],
                admin: ctx.clientIdentity.getID()
            };
    
            await ctx.stub.putState(tokenhospital, Buffer.from(JSON.stringify(hospital)));
            console.log('Created new hospital:', hospital);
        } catch (error) {
            console.error('Error in createHospital:', error);
            throw new Error(`Failed to create hospital: ${error}`);
        }
    }
    
   
    generateToken(namehospital) {
        const hash = crypto.createHash('sha256');
        hash.update(namehospital);
        const result = hash.digest('hex');
        console.log('Generated token:', result);
        return result;
    }
    

    async createDoctor(ctx, namedoctor, specialization, hospitalId) {
        console.log('Starting createDoctor transaction');
        console.log(`Parameters: namedoctor=${namedoctor}, specialization=${specialization}, hospitalId=${hospitalId}`);

        try {
            const hospitalAsBytes = await ctx.stub.getState(hospitalId);
            if (!hospitalAsBytes || hospitalAsBytes.length === 0) {
                throw new Error(`Hospital ${hospitalId} does not exist`);
            }

            let hospital = JSON.parse(hospitalAsBytes.toString());

            const doctortoken = this.generateToken(namedoctor); // Generate token for the doctor

            const doctor = {
                doctorId: doctortoken,
                namedoctor,
                specialization,
                hospitalId,
                admincreate: ctx.clientIdentity.getID(),
            };

            if (!hospital.doctors) {
                hospital.doctors = [];
            }

            hospital.doctors.push(doctor);

            await ctx.stub.putState(hospitalId, Buffer.from(JSON.stringify(hospital))); // Save the hospital state with the new doctor
            console.log('Added doctor:', doctor);
        } catch (error) {
            console.error('Failed to create doctor:', error);
            throw error; // Rethrow the error to indicate transaction failure
        }
    }

    async createMedicalBook(ctx, doctorId, hospitalId, patientName, patientYear, appointment, typeDisease) {
        const medicalBookId = this.generateToken(patientName);

        const medicalBook = {
            medicalBookId,
            patientName,
            patientYear,
            medicalhistory: [
                {
                    doctorId,
                    hospitalId,
                    appointment,
                    typeDisease,
                    adminhospital: ctx.clientIdentity.getID()
                }
            ],
        };

        await ctx.stub.putState(medicalBookId, Buffer.from(JSON.stringify(medicalBook)));
        console.log('Created new medical book:', medicalBook);
    }

    async addMedicalHistory(ctx, medicalBookId, doctorId, hospitalId, appointment, typeDisease) {
        const medicalBookBytes = await ctx.stub.getState(medicalBookId);
        if (!medicalBookBytes || medicalBookBytes.length === 0) {
            throw new Error(`Medical book with ID ${medicalBookId} does not exist`);
        }

        const medicalBook = JSON.parse(medicalBookBytes.toString());

        const newEntry = {
            doctorId,
            hospitalId,
            appointment,
            typeDisease,
            admin: ctx.clientIdentity.getID()
        };

        medicalBook.medicalhistory.push(newEntry);

        await ctx.stub.putState(medicalBookId, Buffer.from(JSON.stringify(medicalBook)));
        console.log('Updated medical book with new entry:', newEntry);
    }

    async getMedicalBook(ctx, medicalBookId) {
        const medicalBookBytes = await ctx.stub.getState(medicalBookId);
        if (!medicalBookBytes || medicalBookBytes.length === 0) {
            throw new Error(`Medical book with ID ${medicalBookId} does not exist`);
        }
        const medicalBook = JSON.parse(medicalBookBytes.toString());
        return medicalBook;
    }

    async getAllHospitals(ctx) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const hospitals = [];

        while (true) {
            const result = await iterator.next();
            if (result.value && result.value.value.toString()) {
                const strValue = result.value.value.toString('utf8');
                let record;
                try {
                    record = JSON.parse(strValue);
                } catch (err) {
                    console.log(err);
                    record = strValue;
                }
                hospitals.push(record);
            }
            if (result.done) {
                await iterator.close();
                return JSON.stringify(hospitals);
            }
        }
    }
}

module.exports = HospitalContract;
