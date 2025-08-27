import { db } from '../db';
import { carsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteCar = async (id: number): Promise<boolean> => {
  try {
    // Delete car record by ID
    const result = await db.delete(carsTable)
      .where(eq(carsTable.id, id))
      .execute();

    // Check if any rows were affected (car was found and deleted)
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Car deletion failed:', error);
    throw error;
  }
};