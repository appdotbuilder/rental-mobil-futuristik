import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type CarFilter } from '../schema';
import { getCars } from '../handlers/get_cars';

// Test data for creating cars
const testCars = [
  {
    name: 'Toyota Avanza',
    brand: 'Toyota',
    model: 'Avanza',
    year: 2022,
    image_url: 'https://example.com/avanza.jpg',
    rental_price_per_day: '300000',
    transmission: 'manual' as const,
    fuel_type: 'gasoline' as const,
    seats: 7,
    description: 'Family car with spacious interior',
    features: '["AC", "Radio", "Power Steering"]',
    is_available: true
  },
  {
    name: 'Honda Jazz',
    brand: 'Honda',
    model: 'Jazz',
    year: 2021,
    image_url: 'https://example.com/jazz.jpg',
    rental_price_per_day: '250000',
    transmission: 'automatic' as const,
    fuel_type: 'gasoline' as const,
    seats: 5,
    description: 'Compact city car',
    features: '["AC", "Radio", "ABS"]',
    is_available: true
  },
  {
    name: 'Tesla Model 3',
    brand: 'Tesla',
    model: 'Model 3',
    year: 2023,
    image_url: 'https://example.com/tesla.jpg',
    rental_price_per_day: '800000',
    transmission: 'automatic' as const,
    fuel_type: 'electric' as const,
    seats: 5,
    description: 'Electric luxury sedan',
    features: '["Autopilot", "AC", "Premium Audio"]',
    is_available: false
  },
  {
    name: 'Mitsubishi Xpander',
    brand: 'Mitsubishi',
    model: 'Xpander',
    year: 2020,
    image_url: 'https://example.com/xpander.jpg',
    rental_price_per_day: '350000',
    transmission: 'manual' as const,
    fuel_type: 'gasoline' as const,
    seats: 7,
    description: 'MPV with good fuel efficiency',
    features: '["AC", "USB Port", "Airbags"]',
    is_available: true
  }
];

describe('getCars', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all cars when no filter is provided', async () => {
    // Insert test data
    await db.insert(carsTable).values(testCars).execute();

    const result = await getCars();

    expect(result).toHaveLength(4);
    expect(result[0].name).toBeDefined();
    expect(result[0].brand).toBeDefined();
    expect(typeof result[0].rental_price_per_day).toBe('number');
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no cars exist', async () => {
    const result = await getCars();

    expect(result).toHaveLength(0);
  });

  it('should filter cars by brand', async () => {
    await db.insert(carsTable).values(testCars).execute();

    const filter: CarFilter = { brand: 'Toyota' };
    const result = await getCars(filter);

    expect(result).toHaveLength(1);
    expect(result[0].brand).toEqual('Toyota');
    expect(result[0].name).toEqual('Toyota Avanza');
  });

  it('should filter cars by transmission type', async () => {
    await db.insert(carsTable).values(testCars).execute();

    const filter: CarFilter = { transmission: 'automatic' };
    const result = await getCars(filter);

    expect(result).toHaveLength(2);
    result.forEach(car => {
      expect(car.transmission).toEqual('automatic');
    });
  });

  it('should filter cars by fuel type', async () => {
    await db.insert(carsTable).values(testCars).execute();

    const filter: CarFilter = { fuel_type: 'electric' };
    const result = await getCars(filter);

    expect(result).toHaveLength(1);
    expect(result[0].fuel_type).toEqual('electric');
    expect(result[0].brand).toEqual('Tesla');
  });

  it('should filter cars by price range', async () => {
    await db.insert(carsTable).values(testCars).execute();

    const filter: CarFilter = { 
      min_price: 250000, 
      max_price: 350000 
    };
    const result = await getCars(filter);

    expect(result).toHaveLength(3);
    result.forEach(car => {
      expect(car.rental_price_per_day).toBeGreaterThanOrEqual(250000);
      expect(car.rental_price_per_day).toBeLessThanOrEqual(350000);
    });
  });

  it('should filter cars by minimum price only', async () => {
    await db.insert(carsTable).values(testCars).execute();

    const filter: CarFilter = { min_price: 350000 };
    const result = await getCars(filter);

    expect(result).toHaveLength(2);
    result.forEach(car => {
      expect(car.rental_price_per_day).toBeGreaterThanOrEqual(350000);
    });
  });

  it('should filter cars by seat count range', async () => {
    await db.insert(carsTable).values(testCars).execute();

    const filter: CarFilter = { 
      min_seats: 5,
      max_seats: 5
    };
    const result = await getCars(filter);

    expect(result).toHaveLength(2);
    result.forEach(car => {
      expect(car.seats).toEqual(5);
    });
  });

  it('should filter cars by availability status', async () => {
    await db.insert(carsTable).values(testCars).execute();

    const filter: CarFilter = { is_available: false };
    const result = await getCars(filter);

    expect(result).toHaveLength(1);
    expect(result[0].is_available).toBe(false);
    expect(result[0].brand).toEqual('Tesla');
  });

  it('should handle multiple filters combined', async () => {
    await db.insert(carsTable).values(testCars).execute();

    const filter: CarFilter = {
      transmission: 'manual',
      fuel_type: 'gasoline',
      is_available: true,
      min_seats: 7
    };
    const result = await getCars(filter);

    expect(result).toHaveLength(2);
    result.forEach(car => {
      expect(car.transmission).toEqual('manual');
      expect(car.fuel_type).toEqual('gasoline');
      expect(car.is_available).toBe(true);
      expect(car.seats).toEqual(7);
    });
  });

  it('should return empty array when filters match no cars', async () => {
    await db.insert(carsTable).values(testCars).execute();

    const filter: CarFilter = {
      brand: 'BMW',
      fuel_type: 'diesel'
    };
    const result = await getCars(filter);

    expect(result).toHaveLength(0);
  });

  it('should convert numeric price field correctly', async () => {
    await db.insert(carsTable).values([testCars[0]]).execute();

    const result = await getCars();

    expect(result).toHaveLength(1);
    expect(typeof result[0].rental_price_per_day).toBe('number');
    expect(result[0].rental_price_per_day).toEqual(300000);
  });

  it('should order cars by created_at descending by default', async () => {
    // Insert cars one by one to ensure different timestamps
    for (const car of testCars) {
      await db.insert(carsTable).values([car]).execute();
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    const result = await getCars();

    expect(result).toHaveLength(4);
    // Verify descending order by checking timestamps
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].created_at.getTime()).toBeGreaterThanOrEqual(
        result[i].created_at.getTime()
      );
    }
  });

  it('should handle edge case with zero price filter', async () => {
    await db.insert(carsTable).values(testCars).execute();

    const filter: CarFilter = { min_price: 0 };
    const result = await getCars(filter);

    expect(result).toHaveLength(4);
    result.forEach(car => {
      expect(car.rental_price_per_day).toBeGreaterThanOrEqual(0);
    });
  });
});