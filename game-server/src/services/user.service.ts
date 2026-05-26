import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class UserService {
  static async getOrCreateUser(address: string) {
    try {
      const user = await prisma.user.upsert({
        where: { address },
        update: {},
        create: {
          address,
          balance: 10000, // Demo starting balance
        },
      });
      return user;
    } catch (error) {
      logger.error({ error, address }, 'Failed to get/create user');
      throw new Error('Database operation failed');
    }
  }

  static async placeBet(userId: string, game: string, amount: number) {
    // Transaction to ensure balance doesn't go below 0
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.balance < amount) {
        throw new Error('Insufficient balance');
      }

      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: amount } },
      });

      const bet = await tx.bet.create({
        data: {
          userId,
          game,
          amount,
        },
      });

      return bet;
    });
  }
}
