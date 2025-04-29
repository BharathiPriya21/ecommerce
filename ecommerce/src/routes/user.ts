import express from 'express';
import { loginUser, registration } from '../controller/user-controller';

const router = express.Router();

router.post('/register', registration);
router.post('/login', loginUser);

export default router;

import {check,validationResult} from 'express-validator';
import { Response,Request,NextFunction } from 'express';

