import express, { Router, Response, Request } from 'express';
import axios, { AxiosResponse } from 'axios';

import { CompanyDB } from '../db/company.db';
import { Company } from '../db/company.model';
import { Posting } from '../posting-api/posting.model';

// Set Axios base URL to mock server
axios.defaults.baseURL = 'http://localhost:8000';

export const companyPostingApi = (companyBD: CompanyDB) => {

  const router: Router = express.Router();


  router.get('/company-postings', async (req: Request, res: Response) => {
    try {

      const { equipmentType, fullPartial, page = 1, limit = 10 } = req.query;

      const response: AxiosResponse<{ postings: Posting[] }> = await axios.get('/postings');
      let postings = response.data.postings;

      if (equipmentType) {
        postings = postings.filter((p: Posting) => p.freight.equipmentType === equipmentType);
      }

      if (fullPartial) {
        postings = postings.filter((p: Posting) => p.freight.fullPartial === fullPartial);
      }

      //Pagination logic.

      const startIndex : number = (Number(page) - 1) * Number(limit);
      const endIndex : number = startIndex + Number(limit);
      const paginatedPostings = postings.slice(startIndex, endIndex);

      const companyPostings = paginatedPostings.map((postings: Posting) => {
        const company: Company | null = companyBD.getCompanyById(postings.companyId);

        return {
          companyName: company ? company.name : 'Unknown Company',
          equipmentType: postings.freight.equipmentType,
          fullPartial: postings.freight.fullPartial,
          weightPounds: postings.freight.weightPounds,
          lengthFeet: postings.freight.lengthFeet || 'N/A',

        };
      });

      res.status(200).json({
        total: postings.length,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(postings.length / Number(limit)),
        postings: companyPostings
      });

    } catch (error) {
      console.error('Error fetching postings: ', error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};