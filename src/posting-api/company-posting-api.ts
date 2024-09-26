import express from 'express';
import axios, { AxiosResponse } from 'axios';

import { CompanyDB } from '../db/company.db';
import { Company } from '../db/company.model';

const router = express.Router(); 
const companyBD = new CompanyDB(); 

interface Freight {
  equipmentType: string;
  fullPartial: string;
  lengthFeet?: number;
  weightPounds:  string;
}

interface Posting {
  companyId: string;
  freight: Freight;
}

router.get('api/v1/company-postings',async (req: Request, res: Response) => {
  try {
    console.log("here")
    const {equipmentType, fullPartial} = req.query;
    const response: AxiosResponse <{postings: Posting[]}> =await axios.get('/postings'); 

    let postings = response.data.postings; 

    if(equipmentType) {
      postings = postings.filter((p: Posting) => p.freight.equipmentType === equipmentType);
    }

    if(fullPartial) {
      postings = postings.filter((p: Posting) => p.freight.fullPartial === fullPartial);
    }

    const companyPostings = postings.map((postings: Posting) => {
      const company: Company | null = companyBD.getCompanyById(postings.companyId); 

      return {
        companyName: company ? company.name : 'Unknown Company',
        equipmentType: postings.freight.equipmentType,
        fullPartial: postings.freight.fullPartial,
        weightPounds:postings.freight.weightPounds,
        lengthFeet: postings.freight.lengthFeet || 'N/A',

      };
    });
    res.status(200).json({postings: companyPostings});

  } catch (error) {
    console.error("Error fetching postings: ", error);
    res.status(500).send('Internal Server Error');
  }
})

export default router; 