import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserService } from '../services/user.service';

const getProfileSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
});

export class UserController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = getProfileSchema.parse(req.query);
      const user = await UserService.getOrCreateUser(address);
      res.json({ user });
    } catch (error) {
      next(error);
    }
  }
}
