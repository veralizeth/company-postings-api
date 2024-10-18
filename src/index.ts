import express, { Express, Request, Response } from 'express';
import * as dotenv from 'dotenv';
import postingAPIServer from './posting-api/posting-api-mock-server';
import { CompanyDB } from './db/company.db';
import { Company } from './db/company.model';
import { companyPostingApi } from './routes/company-posting-api';
import { companyPostingApiPost } from './routes/company-posting-api-post';
import { postingsData } from './posting-api/posting-api-mock-server';


// Start the mock Posting API server
postingAPIServer();
dotenv.config();


const db: CompanyDB = new CompanyDB();
const app: Express = express();

const port = process.env.PORT || 3000;
const companyCollection: Collection<Company> = db.getCompanyCompanyCollection();

// For body postiong POST payload - JSON parsing
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send(`
    <h1>API Instructions</h1>
    
    <p>To get postings by company, go to the following route:</p>
    <pre><code>GET /company-postings</code></pre>
    <p>Example GET request URL:</p>
    <pre><code>http://localhost:8000/company-postings</code></pre>
    
    <p>To post a new posting, use the following route:</p>
    <pre><code>POST /company-postings</code></pre>

    <p>Example POST request URL:</p>
    <pre><code>http://localhost:8000/postings</code></pre>
    
    <p>Format for posting a new posting:</p>
    <pre><code>
      {
        "companyId": "1",
        "freight": {
          "weightPounds": 1000,
          "equipmentType": "Truck",
          "fullPartial": "Full",
          "lengthFeet": 40
        }
      }
    </code></pre>

    <h3>Required Fields:</h3>
    <ul>
      <li>postings.companyId</li>
      <li>postings.freight.weightPounds</li>
      <li>postings.freight.equipmentType</li>
      <li>postings.freight.fullPartial</li>
      <li>postings.freight.lengthFeet</li>
    </ul>
  `);
});

app.get('/companies', async (req: Request, res: Response) => {
  const companies: Company[] = await companyCollection.find({});
  res.send(companies);
});

app.use('/', companyPostingApi(db));
app.use('/', companyPostingApiPost(db, postingsData));

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
