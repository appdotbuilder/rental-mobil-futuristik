import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type CreateCarInput } from '../schema';
import { createCar } from '../handlers/create_car';
import { eq } from 'drizzle-orm';

// Complete test input with all required fields
const testInput: CreateCarInput = {
  name: 'Test Car Premium',
  brand: 'Toyota',
  model: 'Camry',
  year: 2023,
  image_url: 'https://example.com/car.jpg',
  rental_price_per_day: 150000,
  transmission: 'automatic',
  fuel_type: 'gasoline',
  seats: 5,
  description: 'Comfortable sedan for business trips',
  features: '["AC", "GPS", "Bluetooth", "Backup Camera"]',
  is_available: true
};

describe('createCar', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a car with all fields', async () => {
    const result = await createCar(testInput);

    // Verify all basic fields
    expect(result.name).toEqual('Test Car Premium');
    expect(result.brand).toEqual('Toyota');
    expect(result.model).toEqual('Camry');
    expect(result.year).toEqual(2023);
    expect(result.image_url).toEqual('https://example.com/car.jpg');
    expect(result.rental_price_per_day).toEqual(150000);
    expect(typeof result.rental_price_per_day).toEqual('number'); // Verify numeric conversion
    expect(result.transmission).toEqual('automatic');
    expect(result.fuel_type).toEqual('gasoline');
    expect(result.seats).toEqual(5);
    expect(result.description).toEqual('Comfortable sedan for business trips');
    expect(result.features).toEqual('["AC", "GPS", "Bluetooth", "Backup Camera"]');
    expect(result.is_available).toEqual(true);
    
    // Verify generated fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save car to database correctly', async () => {
    const result = await createCar(testInput);

    // Query the database to verify data was saved
    const cars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, result.id))
      .execute();

    expect(cars).toHaveLength(1);
    const savedCar = cars[0];
    
    expect(savedCar.name).toEqual('Test Car Premium');
    expect(savedCar.brand).toEqual('Toyota');
    expect(savedCar.model).toEqual('Camry');
    expect(savedCar.year).toEqual(2023);
    expect(parseFloat(savedCar.rental_price_per_day)).toEqual(150000); // Verify numeric storage
    expect(savedCar.transmission).toEqual('automatic');
    expect(savedCar.fuel_type).toEqual('gasoline');
    expect(savedCar.seats).toEqual(5);
    expect(savedCar.is_available).toEqual(true);
    expect(savedCar.created_at).toBeInstanceOf(Date);
    expect(savedCar.updated_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    const inputWithNulls: CreateCarInput = {
      name: 'Basic Car',
      brand: 'Honda',
      model: 'Civic',
      year: 2022,
      image_url: 'https://example.com/civic.jpg',
      rental_price_per_day: 120000,
      transmission: 'manual',
      fuel_type: 'gasoline',
      seats: 4,
      description: null,
      features: null,
      is_available: true
    };

    const result = await createCar(inputWithNulls);

    expect(result.description).toBeNull();
    expect(result.features).toBeNull();
    expect(result.name).toEqual('Basic Car');
    expect(result.rental_price_per_day).toEqual(120000);
    expect(typeof result.rental_price_per_day).toEqual('number');
  });

  it('should handle different transmission types', async () => {
    const manualCarInput: CreateCarInput = {
      ...testInput,
      name: 'Manual Test Car',
      transmission: 'manual'
    };

    const result = await createCar(manualCarInput);
    expect(result.transmission).toEqual('manual');
    expect(result.name).toEqual('Manual Test Car');
  });

  it('should handle different fuel types', async () => {
    const electricCarInput: CreateCarInput = {
      ...testInput,
      name: 'Electric Test Car',
      fuel_type: 'electric',
      rental_price_per_day: 200000
    };

    const result = await createCar(electricCarInput);
    expect(result.fuel_type).toEqual('electric');
    expect(result.rental_price_per_day).toEqual(200000);
    expect(typeof result.rental_price_per_day).toEqual('number');
  });

  it('should handle is_available set to false', async () => {
    const unavailableCarInput: CreateCarInput = {
      name: 'Unavailable Test Car',
      brand: 'Ford',
      model: 'Focus',
      year: 2023,
      image_url: 'https://example.com/focus.jpg',
      rental_price_per_day: 110000,
      transmission: 'automatic',
      fuel_type: 'gasoline',
      seats: 5,
      description: null,
      features: null,
      is_available: false
    };

    const result = await createCar(unavailableCarInput);
    expect(result.is_available).toEqual(false);
    expect(result.name).toEqual('Unavailable Test Car');
  });
});