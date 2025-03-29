import {Router} from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { setDriverDetails } from '../controllers/driver.controller.js';

const router = Router();

// routers with post method
router.route('/set-details').post( verifyJWT, setDriverDetails);

export default router;