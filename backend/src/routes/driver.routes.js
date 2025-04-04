import {Router} from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { addDriverRating, assignBusToDriver, deleteDriver, getAllDrivers, removeDriverFromBus, removeDriverRating, setDriverDetails, updateDriverDetails } from '../controllers/driver.controller.js';

const router = Router();
router.use(verifyJWT)

// routes
router.route('/set-details').post( setDriverDetails);
router.route('/assign-duty').put(assignBusToDriver);
router.route('/release-duty').delete(removeDriverFromBus);
router.route('/add-review').put(addDriverRating);
router.route('/delete-review').delete(removeDriverRating);
router.route('/getAllDriver').get(getAllDrivers);
router.route('/update-details/:id').put(updateDriverDetails);
router.route('/delete').delete(deleteDriver);



export default router;