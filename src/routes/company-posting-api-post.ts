import express, { Router, Response, Request } from 'express';

import { CompanyDB } from '../db/company.db';
import { Posting, Freight } from '../posting-api/posting.model';

export const companyPostingApiPost = (companyBD: CompanyDB, postingsData: any[]) => {
    const router: Router = express.Router();

    router.post('/postings', (req: Request, res: Response) => {
        try {

            const { companyId, freight }: { companyId: string, freight: Freight } = req.body;

            if (!companyId || !freight?.equipmentType || !freight?.fullPartial || !freight?.weightPounds) {
                return res.status(400).send('Missing required fields: equipmentType, fullPartial, weightPounds or companyId');
            }

            if (freight.lengthFeet && typeof freight.lengthFeet !== 'number') {
                return res.status(400).send('Length must be a number.');
            }

            const company = companyBD.getCompanyById(companyId);

            if (!company) {
                return res.status(400).send('Company not found');
            }


            const newPosting: Posting = {
                companyId: company.id,
                freight: {
                    equipmentType: freight.equipmentType,
                    fullPartial: freight.fullPartial,
                    weightPounds: freight.weightPounds,
                    lengthFeet: freight.lengthFeet
                },
            };

            postingsData.push(newPosting);

            return res.status(201).json({message: 'Posting created successfully', posting: newPosting});

        } catch (error) {
            console.error('Error creating a new posting:', error);
            return res.status(500).send('Internal Server Error');
        }
    });

    return router;
};