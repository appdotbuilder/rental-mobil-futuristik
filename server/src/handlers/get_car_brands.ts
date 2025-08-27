import { db } from '../db';
import { carsTable } from '../db/schema';
import { sql } from 'drizzle-orm';

export const getCarBrands = async (): Promise<string[]> => {
  try {
    // Get distinct brands from cars table, ordered alphabetically
    const results = await db
      .selectDistinct({ brand: carsTable.brand })
      .from(carsTable)
      .orderBy(carsTable.brand)
      .execute();

    // Extract brand strings from the results
    return results.map(result => result.brand);
  } catch (error) {
    console.error('Failed to fetch car brands:', error);
    throw error;
  }
};