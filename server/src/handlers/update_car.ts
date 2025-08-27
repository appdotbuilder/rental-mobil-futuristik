import { db } from '../db';
import { carsTable } from '../db/schema';
import { type UpdateCarInput, type Car } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCar = async (input: UpdateCarInput): Promise<Car | null> => {
  try {
    // Extract id from input and prepare update data
    const { id, ...updateData } = input;
    
    // Check if car exists
    const existingCar = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, id))
      .execute();
    
    if (existingCar.length === 0) {
      return null;
    }
    
    // Prepare update object with numeric conversions where needed
    const updateValues: Record<string, any> = {};
    
    // Copy all non-undefined fields from updateData
    Object.keys(updateData).forEach(key => {
      const value = (updateData as any)[key];
      if (value !== undefined) {
        // Convert numeric fields to strings for database storage
        if (key === 'rental_price_per_day') {
          updateValues[key] = value.toString();
        } else {
          updateValues[key] = value;
        }
      }
    });
    
    // Always update the updated_at timestamp
    updateValues['updated_at'] = new Date();
    
    // Update the car record
    const result = await db.update(carsTable)
      .set(updateValues)
      .where(eq(carsTable.id, id))
      .returning()
      .execute();
    
    if (result.length === 0) {
      return null;
    }
    
    // Convert numeric fields back to numbers before returning
    const updatedCar = result[0];
    return {
      ...updatedCar,
      rental_price_per_day: parseFloat(updatedCar.rental_price_per_day)
    };
  } catch (error) {
    console.error('Car update failed:', error);
    throw error;
  }
};