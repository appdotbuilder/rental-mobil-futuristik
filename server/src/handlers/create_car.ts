import { db } from '../db';
import { carsTable } from '../db/schema';
import { type CreateCarInput, type Car } from '../schema';

export const createCar = async (input: CreateCarInput): Promise<Car> => {
  try {
    // Insert car record
    const result = await db.insert(carsTable)
      .values({
        name: input.name,
        brand: input.brand,
        model: input.model,
        year: input.year,
        image_url: input.image_url,
        rental_price_per_day: input.rental_price_per_day.toString(), // Convert number to string for numeric column
        transmission: input.transmission,
        fuel_type: input.fuel_type,
        seats: input.seats,
        description: input.description,
        features: input.features,
        is_available: input.is_available
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const car = result[0];
    return {
      ...car,
      rental_price_per_day: parseFloat(car.rental_price_per_day) // Convert string back to number
    };
  } catch (error) {
    console.error('Car creation failed:', error);
    throw error;
  }
};