import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const apiRouter = Router();

// User Routes
apiRouter.get('/user/profile', UserController.getProfile);

export { apiRouter };
