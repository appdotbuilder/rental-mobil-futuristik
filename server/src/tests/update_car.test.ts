import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type UpdateCarInput, type CreateCarInput } from '../schema';
import { updateCar } from '../handlers/update_car';
import { eq } from 'drizzle-orm';

// Test car data for setup
const testCarData: CreateCarInput = {
  name: 'Honda Civic',
  brand: 'Honda',
  model: 'Civic',
  year: 2022,
  image_url: 'https://example.com/civic.jpg',
  rental_price_per_day: 150.00,
  transmission: 'automatic',
  fuel_type: 'gasoline',
  seats: 5,
  description: 'Comfortable sedan',
  features: '["AC", "GPS", "Bluetooth"]',
  is_available: true
};

// Helper function to create a test car
const createTestCar = async () => {
  const result = await db.insert(carsTable)
    .values({
      ...testCarData,
      rental_price_per_day: testCarData.rental_price_per_day.toString()
    })
    .returning()
    .execute();
  
  return {
    ...result[0],
    rental_price_per_day: parseFloat(result[0].rental_price_per_day)
  };
};

describe('updateCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update car with all fields', async () => {
    const testCar = await createTestCar();
    
    const updateInput: UpdateCarInput = {
      id: testCar.id,
      name: 'Honda Civic Updated',
      brand: 'Honda',
      model: 'Civic Sport',
      year: 2023,
      image_url: 'https://example.com/civic-updated.jpg',
      rental_price_per_day: 175.50,
      transmission: 'manual',
      fuel_type: 'hybrid',
      seats: 4,
      description: 'Updated sporty sedan',
      features: '["AC", "GPS", "Sport Mode"]',
      is_available: false
    };

    const result = await updateCar(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testCar.id);
    expect(result!.name).toEqual('Honda Civic Updated');
    expect(result!.brand).toEqual('Honda');
    expect(result!.model).toEqual('Civic Sport');
    expect(result!.year).toEqual(2023);
    expect(result!.image_url).toEqual('https://example.com/civic-updated.jpg');
    expect(result!.rental_price_per_day).toEqual(175.50);
    expect(typeof result!.rental_price_per_day).toBe('number');
    expect(result!.transmission).toEqual('manual');
    expect(result!.fuel_type).toEqual('hybrid');
    expect(result!.seats).toEqual(4);
    expect(result!.description).toEqual('Updated sporty sedan');
    expect(result!.features).toEqual('["AC", "GPS", "Sport Mode"]');
    expect(result!.is_available).toBe(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > testCar.updated_at).toBe(true);
  });

  it('should update car with partial fields', async () => {
    const testCar = await createTestCar();
    
    const updateInput: UpdateCarInput = {
      id: testCar.id,
      name: 'Honda Civic Partial Update',
      rental_price_per_day: 165.25,
      is_available: false
    };

    const result = await updateCar(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testCar.id);
    expect(result!.name).toEqual('Honda Civic Partial Update');
    expect(result!.rental_price_per_day).toEqual(165.25);
    expect(typeof result!.rental_price_per_day).toBe('number');
    expect(result!.is_available).toBe(false);
    
    // Unchanged fields should remain the same
    expect(result!.brand).toEqual(testCar.brand);
    expect(result!.model).toEqual(testCar.model);
    expect(result!.year).toEqual(testCar.year);
    expect(result!.transmission).toEqual(testCar.transmission);
    expect(result!.fuel_type).toEqual(testCar.fuel_type);
    expect(result!.seats).toEqual(testCar.seats);
    expect(result!.description).toEqual(testCar.description);
    expect(result!.features).toEqual(testCar.features);
    
    // Timestamps
    expect(result!.created_at).toEqual(testCar.created_at);
    expect(result!.updated_at > testCar.updated_at).toBe(true);
  });

  it('should save updated car to database', async () => {
    const testCar = await createTestCar();
    
    const updateInput: UpdateCarInput = {
      id: testCar.id,
      name: 'Honda Civic DB Test',
      rental_price_per_day: 180.75
    };

    const result = await updateCar(updateInput);

    // Query database directly to verify update
    const cars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, testCar.id))
      .execute();

    expect(cars).toHaveLength(1);
    expect(cars[0].name).toEqual('Honda Civic DB Test');
    expect(parseFloat(cars[0].rental_price_per_day)).toEqual(180.75);
    expect(cars[0].updated_at > testCar.updated_at).toBe(true);
    
    // Verify result matches database
    expect(result!.name).toEqual(cars[0].name);
    expect(result!.rental_price_per_day).toEqual(parseFloat(cars[0].rental_price_per_day));
  });

  it('should return null when car does not exist', async () => {
    const updateInput: UpdateCarInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Car'
    };

    const result = await updateCar(updateInput);
    expect(result).toBeNull();
  });

  it('should update only nullable fields correctly', async () => {
    const testCar = await createTestCar();
    
    const updateInput: UpdateCarInput = {
      id: testCar.id,
      description: null,
      features: null
    };

    const result = await updateCar(updateInput);

    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.features).toBeNull();
    expect(result!.updated_at > testCar.updated_at).toBe(true);
  });

  it('should handle numeric price conversion correctly', async () => {
    const testCar = await createTestCar();
    
    const updateInput: UpdateCarInput = {
      id: testCar.id,
      rental_price_per_day: 199.99
    };

    const result = await updateCar(updateInput);

    expect(result).not.toBeNull();
    expect(result!.rental_price_per_day).toEqual(199.99);
    expect(typeof result!.rental_price_per_day).toBe('number');
    
    // Verify database storage (should be string)
    const dbRecord = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, testCar.id))
      .execute();
    
    expect(typeof dbRecord[0].rental_price_per_day).toBe('string');
    expect(dbRecord[0].rental_price_per_day).toEqual('199.99');
  });

  it('should update enum fields correctly', async () => {
    const testCar = await createTestCar();
    
    const updateInput: UpdateCarInput = {
      id: testCar.id,
      transmission: 'manual',
      fuel_type: 'electric'
    };

    const result = await updateCar(updateInput);

    expect(result).not.toBeNull();
    expect(result!.transmission).toEqual('manual');
    expect(result!.fuel_type).toEqual('electric');
    expect(result!.updated_at > testCar.updated_at).toBe(true);
  });

  it('should update integer fields correctly', async () => {
    const testCar = await createTestCar();
    
    const updateInput: UpdateCarInput = {
      id: testCar.id,
      year: 2024,
      seats: 7
    };

    const result = await updateCar(updateInput);

    expect(result).not.toBeNull();
    expect(result!.year).toEqual(2024);
    expect(result!.seats).toEqual(7);
    expect(typeof result!.year).toBe('number');
    expect(typeof result!.seats).toBe('number');
    expect(result!.updated_at > testCar.updated_at).toBe(true);
  });
});