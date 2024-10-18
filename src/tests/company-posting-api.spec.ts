import request from 'supertest';
import express from 'express';
import { companyPostingApi } from '../routes/company-posting-api';
import axios from 'axios';
import { CompanyDB } from '../db/company.db';
import { Company } from '../db/company.model';

// Mock dependencies.
jest.mock('axios');
jest.mock('../db/company.db');

// These bellow are created to tell TS that are now mocked funtions.
const mockAxiosGet = axios.get as jest.Mock;

// Mock to simulate db responses - without querying the real db.
const mockCompanyDB = new CompanyDB() as jest.Mocked<CompanyDB>;

const app = express();
app.use(express.json());
app.use(companyPostingApi(mockCompanyDB));

describe('GET /company-postings', () => {

  beforeEach(() => {
    // Axios response:
    const mockPostingResponse = {
      data: {
        postings: [
          {
            id: 'LSD2',
            companyId: '1',
            freight: {
              equipmentType: 'Van',
              fullPartial: 'FULL',
              lengthFeet: 53,
              weightPounds: 27000,
            },
          },
          {
            id: 'LSD3',
            companyId: '2',
            freight: {
              equipmentType: 'Reefer',
              fullPartial: 'FULL',
              lengthFeet: 53,
              weightPounds: 40000,
            },
          }
        ]
      }
    };
    mockAxiosGet.mockResolvedValue(mockPostingResponse);

    // DB responses:
    mockCompanyDB.getCompanyById.mockImplementation((id: string): Company | null => {
      if (id === '1') {
        return { id: '1', name: 'Company 1' };
      } else if (id === '2') {
        return { id: '2', name: 'Company 2' };
      }
      return null;
    });

    // Mock console.error to prevent output during tests.
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.clearAllMocks();

  });

  it('should return postings without filters', async () => {
    const response = await request(app).get('/company-postings').query({page: 1, limit: 2});

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      total: 2,
      page: 1, 
      limit:2,
      totalPages: 1,
      postings: [
        {
          companyName: 'Company 1',
          equipmentType: 'Van',
          fullPartial: 'FULL',
          weightPounds: 27000,
          lengthFeet: 53,
        },
        {
          companyName: 'Company 2',
          equipmentType: 'Reefer',
          fullPartial: 'FULL',
          weightPounds: 40000,
          lengthFeet: 53,
        }
      ]
    });

    expect(mockAxiosGet).toHaveBeenCalledWith('/postings');
    expect(mockCompanyDB.getCompanyById).toHaveBeenCalledWith('1');
    expect(mockCompanyDB.getCompanyById).toHaveBeenCalledWith('2');

  });

  it('should return postings filtering by equipment and fullPartial', async () => {
    // Send the request with filters.
    const response = await request(app)
      .get('/company-postings')
      .query({ equipmentType: 'Van', fullPartial: 'FULL' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      total: 1, 
      page: 1,
      limit: 10, 
      totalPages: 1,
      postings: [
        {
          companyName: 'Company 1',
          equipmentType: 'Van',
          fullPartial: 'FULL',
          weightPounds: 27000,
          lengthFeet: 53,
        }
      ]
    });

    expect(mockAxiosGet).toHaveBeenCalledWith('/postings');
    expect(mockCompanyDB.getCompanyById).toHaveBeenCalledWith('1');
  });

  it('should return postings without filtering and handle unknown company', async () => {

    mockAxiosGet.mockResolvedValue({
      data: {
        postings: [
          {
            companyId: '3',
            freight: {
              equipmentType: 'Reefer',
              fullPartial: 'PARTIAL',
              weightPounds: '42000',
            },
          },
        ],
      },
    });

    mockCompanyDB.getCompanyById.mockReturnValue(null);

    const response = await request(app).get('/company-postings');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      total: 1, 
      page: 1,
      limit: 10, 
      totalPages: 1,
      postings: [
        {
          companyName: 'Unknown Company',
          equipmentType: 'Reefer',
          fullPartial: 'PARTIAL',
          weightPounds: '42000',
          lengthFeet: 'N/A',
        },
      ]
    });
    expect(mockAxiosGet).toHaveBeenCalledWith('/postings');
    expect(mockCompanyDB.getCompanyById).toHaveBeenCalledWith('3');
  });

  it('should handle errors and return 500 status', async () => {
    mockAxiosGet.mockRejectedValue(new Error('Network Error'));

    const response = await request(app).get('/company-postings');

    expect(response.status).toBe(500);
    expect(response.text).toBe('Internal Server Error');

    expect(mockAxiosGet).toHaveBeenCalledWith('/postings');
  });
});