import request from 'supertest';
import express from 'express';
import { CompanyDB } from '../db/company.db';
import { Company } from '../db/company.model';
import { Posting } from '../posting-api/posting.model';
import { companyPostingApiPost } from '../routes/company-posting-api-post';


jest.mock('axios');
jest.mock('../db/company.db');


const postingsData: Posting[] = [];

const mockCompanyDB = new CompanyDB() as jest.Mocked<CompanyDB>;

const app = express();
app.use(express.json());

app.use(companyPostingApiPost(mockCompanyDB, postingsData));


describe('POST /postings', () => {

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock console.error to prevent output during tests.
        jest.spyOn(console, 'error').mockImplementation(() => {});
        mockCompanyDB.getCompanyById.mockImplementation((id: string): Company | null => {
            if (id === '1') {
                return { id: '1', name: 'Company 1' };
            } else if (id === '2') {
                return { id: '2', name: 'Company 2' };
            }
            return null;
        });

    });

    it('should return 400 if required fields are missing', async () => {
        const response = await request(app)
            .post('/postings')
            .send({
                companyId: '1234',
                freight: {
                    fullPartial: 'full',
                }
            });
        expect(response.status).toBe(400);
        expect(response.text).toBe('Missing required fields: equipmentType, fullPartial, weightPounds or companyId');
    });

    it('should return 400 if freight.lengthFeet is not a number', async () => {
        const response = await request(app)
            .post('/postings')
            .send({
                companyId: '1234',
                freight: {
                    equipmentType: 'Flatbed',
                    fullPartial: 'PARTIAL',
                    weightPounds: 1000,
                    lengthFeet: 'AAA'
                }
            });
        expect(response.status).toBe(400);
        expect(response.text).toBe('Length must be a number.');
    });

    it('should return 400 if company is not found', async () => {
        mockCompanyDB.getCompanyById.mockReturnValueOnce(null);

        const response = await request(app)
            .post('/postings')
            .send({
                companyId: '1234',
                freight: {
                    equipmentType: 'Flatbed',
                    fullPartial: 'PARTIAL',
                    weightPounds: 1000,
                }
            });
        expect(response.status).toBe(400);
        expect(response.text).toBe('Company not found');
    });

    it('should create a posting and return 201', async () => {

        const response = await request(app)
            .post('/postings')
            .send({
                companyId: '1',
                freight: {
                    equipmentType: 'Flatbed',
                    fullPartial: 'PARTIAL',
                    weightPounds: 1000,
                    lengthFeet: 20
                }
            });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Posting created successfully');
        expect(response.body.posting).toEqual({
            companyId: '1',
            freight: {
                equipmentType: 'Flatbed',
                fullPartial: 'PARTIAL',
                weightPounds: 1000,
                lengthFeet: 20
            }
        });

        expect(postingsData).toHaveLength(1);

        expect(postingsData[0]).toEqual({
            companyId: '1',
            freight: {
                equipmentType: 'Flatbed',
                fullPartial: 'PARTIAL',
                weightPounds: 1000,
                lengthFeet: 20
            }
        });
    });

    it('should handle server errors and return 500', async () => {
        mockCompanyDB.getCompanyById.mockImplementationOnce(() => {
            throw new Error('Database error');
        });

        const response = await request(app)
            .post('/postings')
            .send({
                companyId: '1234',
                freight: {
                    equipmentType: 'Flatbed',
                    fullPartial: 'PARTIAL',
                    weightPounds: 1000,
                }
            });

        expect(response.status).toBe(500);
        expect(response.text).toBe('Internal Server Error');
    });
});