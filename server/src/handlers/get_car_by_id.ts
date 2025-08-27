import { db } from '../db';
import { carsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Car } from '../schema';

export const getCarById = async (id: number): Promise<Car | null> => {
  try {
    const results = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const car = results[0];
    
    // Convert numeric field back to number
    return {
      ...car,
      rental_price_per_day: parseFloat(car.rental_price_per_day)
    };
  } catch (error) {
    console.error('Failed to get car by ID:', error);
    throw error;
  }
};