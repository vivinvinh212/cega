import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


// Get transaction details by ID
app.get('/transactions/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    try {
      let transaction = null;
      if (type === 'deposit') {
        transaction = await prisma.deposit.findUnique({
          where: { id: parseInt(id) },
        });
      } else if (type === 'withdrawal') {
        transaction = await prisma.withdrawal.findUnique({
          where: { id: parseInt(id) },
        });
      }
  
      if (!transaction) {
        return res.status(404).send('Transaction not found');
      }
  
      res.json(transaction);
    } catch (error) {
      res.status(500).send('Error retrieving the transaction');
    }
  });
  
// Get transaction history for a wallet address
app.get('/transactions/history/:address', async (req, res) => {
    const { address } = req.params;
    const { date, amount, type } = req.query;
  
    try {
      const queryOptions = {
        where: { 
          OR: [
            { receiver: address },
            { owner: address }
          ],
          AND: [],
        },
        orderBy: [],
      };
  
      // Date filtering
      if (date) {
        queryOptions.where.AND.push({
          timestamp: {
            gte: new Date(date),
          },
        });
      }
  
      // Amount sorting
      if (amount) {
        queryOptions.orderBy.push({
          amount: amount === 'desc' ? 'desc' : 'asc',
        });
      }
  
      // Execute queries based on type
      const results = await prisma[type].findMany(queryOptions);
      res.json(results);
    } catch (error) {
      res.status(500).send('Error retrieving transaction history');
    }
  });
  
