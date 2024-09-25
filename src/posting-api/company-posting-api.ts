import express from 'express';
import axios from 'axios';

import { CompanyDB } from '../db/company.db';

const router = express.Router(); 
const companyBD = new CompanyDB(); 
