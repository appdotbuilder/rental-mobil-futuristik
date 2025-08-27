import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type CreateCarInput } from '../schema';
import { deleteCar } from '../handlers/delete_car';
import { eq } from 'drizzle-orm';

// Test car data
const testCarInput: CreateCarInput = {
  name: 'Toyota Camry 2023',
  brand: 'Toyota',
  model: 'Camry',
  year: 2023,
  image_url: 'https://example.com/camry.jpg',
  rental_price_per_day: 75.00,
  transmission: 'automatic',
  fuel_type: 'gasoline',
  seats: 5,
  description: 'A reliable mid-size sedan perfect for business trips',
  features: '["Air Conditioning", "GPS Navigation", "Bluetooth", "USB Ports"]',
  is_available: true
};

describe('deleteCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing car and return true', async () => {
    // Create a car first
    const createResult = await db.insert(carsTable)
      .values({
        ...testCarInput,
        rental_price_per_day: testCarInput.rental_price_per_day.toString()
      })
      .returning()
      .execute();

    const carId = createResult[0].id;

    // Delete the car
    const result = await deleteCar(carId);

    expect(result).toBe(true);

    // Verify car is deleted from database
    const cars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, carId))
      .execute();

    expect(cars).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent car', async () => {
    const nonExistentId = 999999;

    const result = await deleteCar(nonExistentId);

    expect(result).toBe(false);
  });

  it('should not affect other cars when deleting one car', async () => {
    // Create two cars
    const car1Result = await db.insert(carsTable)
      .values({
        ...testCarInput,
        name: 'Toyota Camry',
        rental_price_per_day: testCarInput.rental_price_per_day.toString()
      })
      .returning()
      .execute();

    const car2Input = {
      ...testCarInput,
      name: 'Honda Civic',
      brand: 'Honda',
      model: 'Civic',
      rental_price_per_day: '50.00'
    };

    const car2Result = await db.insert(carsTable)
      .values(car2Input)
      .returning()
      .execute();

    const car1Id = car1Result[0].id;
    const car2Id = car2Result[0].id;

    // Delete first car
    const result = await deleteCar(car1Id);

    expect(result).toBe(true);

    // Verify first car is deleted
    const car1Check = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, car1Id))
      .execute();

    expect(car1Check).toHaveLength(0);

    // Verify second car still exists
    const car2Check = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, car2Id))
      .execute();

    expect(car2Check).toHaveLength(1);
    expect(car2Check[0].name).toBe('Honda Civic');
  });

  it('should handle deletion of car with all nullable fields as null', async () => {
    // Create car with minimal required fields
    const minimalCar = {
      name: 'Basic Car',
      brand: 'Generic',
      model: 'Basic',
      year: 2020,
      image_url: 'https://example.com/basic.jpg',
      rental_price_per_day: '30.00',
      transmission: 'manual' as const,
      fuel_type: 'gasoline' as const,
      seats: 4,
      description: null,
      features: null,
      is_available: true
    };

    const createResult = await db.insert(carsTable)
      .values(minimalCar)
      .returning()
      .execute();

    const carId = createResult[0].id;

    // Delete the car
    const result = await deleteCar(carId);

    expect(result).toBe(true);

    // Verify car is deleted
    const cars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, carId))
      .execute();

    expect(cars).toHaveLength(0);
  });

  it('should handle multiple consecutive deletions correctly', async () => {
    // Create a car
    const createResult = await db.insert(carsTable)
      .values({
        ...testCarInput,
        rental_price_per_day: testCarInput.rental_price_per_day.toString()
      })
      .returning()
      .execute();

    const carId = createResult[0].id;

    // First deletion should succeed
    const firstDelete = await deleteCar(carId);
    expect(firstDelete).toBe(true);

    // Second deletion of the same ID should return false
    const secondDelete = await deleteCar(carId);
    expect(secondDelete).toBe(false);
  });
});