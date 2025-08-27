import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type CreateCarInput } from '../schema';
import { getCarById } from '../handlers/get_car_by_id';

// Test car data
const testCarInput: CreateCarInput = {
  name: 'Toyota Avanza',
  brand: 'Toyota',
  model: 'Avanza',
  year: 2023,
  image_url: 'https://example.com/avanza.jpg',
  rental_price_per_day: 350000,
  transmission: 'manual',
  fuel_type: 'gasoline',
  seats: 7,
  description: 'Mobil keluarga yang nyaman dan irit',
  features: '["AC", "Audio System", "Power Steering"]',
  is_available: true
};

describe('getCarById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a car when found', async () => {
    // Create test car
    const insertResult = await db.insert(carsTable)
      .values({
        ...testCarInput,
        rental_price_per_day: testCarInput.rental_price_per_day.toString()
      })
      .returning()
      .execute();

    const createdCar = insertResult[0];
    
    // Get car by ID
    const result = await getCarById(createdCar.id);

    // Verify result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdCar.id);
    expect(result!.name).toEqual('Toyota Avanza');
    expect(result!.brand).toEqual('Toyota');
    expect(result!.model).toEqual('Avanza');
    expect(result!.year).toEqual(2023);
    expect(result!.image_url).toEqual('https://example.com/avanza.jpg');
    expect(result!.rental_price_per_day).toEqual(350000);
    expect(typeof result!.rental_price_per_day).toBe('number');
    expect(result!.transmission).toEqual('manual');
    expect(result!.fuel_type).toEqual('gasoline');
    expect(result!.seats).toEqual(7);
    expect(result!.description).toEqual('Mobil keluarga yang nyaman dan irit');
    expect(result!.features).toEqual('["AC", "Audio System", "Power Steering"]');
    expect(result!.is_available).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when car is not found', async () => {
    const result = await getCarById(999);
    expect(result).toBeNull();
  });

  it('should handle car with nullable fields', async () => {
    // Create car with nullable fields set to null
    const carWithNulls: CreateCarInput = {
      ...testCarInput,
      description: null,
      features: null
    };

    const insertResult = await db.insert(carsTable)
      .values({
        ...carWithNulls,
        rental_price_per_day: carWithNulls.rental_price_per_day.toString()
      })
      .returning()
      .execute();

    const createdCar = insertResult[0];
    
    // Get car by ID
    const result = await getCarById(createdCar.id);

    // Verify nullable fields
    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.features).toBeNull();
    expect(result!.name).toEqual('Toyota Avanza');
    expect(result!.rental_price_per_day).toEqual(350000);
    expect(typeof result!.rental_price_per_day).toBe('number');
  });

  it('should handle different car configurations', async () => {
    // Create electric car with automatic transmission
    const electricCar: CreateCarInput = {
      name: 'Tesla Model 3',
      brand: 'Tesla',
      model: 'Model 3',
      year: 2024,
      image_url: 'https://example.com/tesla.jpg',
      rental_price_per_day: 1500000,
      transmission: 'automatic',
      fuel_type: 'electric',
      seats: 5,
      description: 'Mobil listrik premium',
      features: '["Autopilot", "Premium Audio", "Supercharger"]',
      is_available: false
    };

    const insertResult = await db.insert(carsTable)
      .values({
        ...electricCar,
        rental_price_per_day: electricCar.rental_price_per_day.toString()
      })
      .returning()
      .execute();

    const createdCar = insertResult[0];
    
    // Get car by ID
    const result = await getCarById(createdCar.id);

    // Verify different configuration
    expect(result).not.toBeNull();
    expect(result!.brand).toEqual('Tesla');
    expect(result!.transmission).toEqual('automatic');
    expect(result!.fuel_type).toEqual('electric');
    expect(result!.rental_price_per_day).toEqual(1500000);
    expect(typeof result!.rental_price_per_day).toBe('number');
    expect(result!.is_available).toEqual(false);
  });

  it('should handle multiple cars in database', async () => {
    // Create multiple cars
    const cars = [
      { ...testCarInput, name: 'Car 1' },
      { ...testCarInput, name: 'Car 2', brand: 'Honda' },
      { ...testCarInput, name: 'Car 3', model: 'Innova' }
    ];

    const insertPromises = cars.map(car => 
      db.insert(carsTable)
        .values({
          ...car,
          rental_price_per_day: car.rental_price_per_day.toString()
        })
        .returning()
        .execute()
    );

    const results = await Promise.all(insertPromises);
    
    // Get second car by ID
    const secondCarId = results[1][0].id;
    const result = await getCarById(secondCarId);

    // Verify correct car is returned
    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Car 2');
    expect(result!.brand).toEqual('Honda');
    expect(result!.model).toEqual('Avanza'); // Should still have original model
    expect(result!.id).toEqual(secondCarId);
  });
});