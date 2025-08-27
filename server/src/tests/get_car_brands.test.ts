import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { getCarBrands } from '../handlers/get_car_brands';

describe('getCarBrands', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no cars exist', async () => {
    const result = await getCarBrands();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return unique brands from cars table', async () => {
    // Create test cars with different brands
    await db.insert(carsTable).values([
      {
        name: 'Avanza',
        brand: 'Toyota',
        model: 'Avanza G',
        year: 2020,
        image_url: 'https://example.com/avanza.jpg',
        rental_price_per_day: '350000',
        transmission: 'manual',
        fuel_type: 'gasoline',
        seats: 7,
        description: 'Mobil keluarga nyaman',
        features: '["AC", "Power Steering"]',
        is_available: true
      },
      {
        name: 'Innova',
        brand: 'Toyota',
        model: 'Innova Reborn',
        year: 2021,
        image_url: 'https://example.com/innova.jpg',
        rental_price_per_day: '450000',
        transmission: 'automatic',
        fuel_type: 'diesel',
        seats: 8,
        description: 'MPV premium',
        features: '["AC", "Power Steering", "ABS"]',
        is_available: true
      },
      {
        name: 'Jazz',
        brand: 'Honda',
        model: 'Jazz RS',
        year: 2019,
        image_url: 'https://example.com/jazz.jpg',
        rental_price_per_day: '300000',
        transmission: 'automatic',
        fuel_type: 'gasoline',
        seats: 5,
        description: 'Hatchback sporty',
        features: '["AC", "Power Steering", "Airbags"]',
        is_available: true
      }
    ]).execute();

    const result = await getCarBrands();
    
    expect(result).toEqual(['Honda', 'Toyota']);
    expect(result).toHaveLength(2);
  });

  it('should return brands in alphabetical order', async () => {
    // Create test cars with brands in non-alphabetical order
    await db.insert(carsTable).values([
      {
        name: 'Xpander',
        brand: 'Mitsubishi',
        model: 'Xpander Ultimate',
        year: 2022,
        image_url: 'https://example.com/xpander.jpg',
        rental_price_per_day: '400000',
        transmission: 'automatic',
        fuel_type: 'gasoline',
        seats: 7,
        description: 'MPV modern',
        features: '["AC", "Power Steering"]',
        is_available: true
      },
      {
        name: 'Avanza',
        brand: 'Toyota',
        model: 'Avanza Veloz',
        year: 2020,
        image_url: 'https://example.com/avanza.jpg',
        rental_price_per_day: '350000',
        transmission: 'manual',
        fuel_type: 'gasoline',
        seats: 7,
        description: 'Mobil keluarga',
        features: '["AC"]',
        is_available: true
      },
      {
        name: 'Brio',
        brand: 'Honda',
        model: 'Brio Satya',
        year: 2018,
        image_url: 'https://example.com/brio.jpg',
        rental_price_per_day: '250000',
        transmission: 'manual',
        fuel_type: 'gasoline',
        seats: 5,
        description: 'City car ekonomis',
        features: '["AC"]',
        is_available: false
      }
    ]).execute();

    const result = await getCarBrands();
    
    // Should be sorted alphabetically: Honda, Mitsubishi, Toyota
    expect(result).toEqual(['Honda', 'Mitsubishi', 'Toyota']);
    expect(result[0]).toBe('Honda');
    expect(result[1]).toBe('Mitsubishi');
    expect(result[2]).toBe('Toyota');
  });

  it('should not return duplicate brands', async () => {
    // Create multiple cars with the same brand
    await db.insert(carsTable).values([
      {
        name: 'Avanza',
        brand: 'Toyota',
        model: 'Avanza G',
        year: 2020,
        image_url: 'https://example.com/avanza.jpg',
        rental_price_per_day: '350000',
        transmission: 'manual',
        fuel_type: 'gasoline',
        seats: 7,
        description: 'Mobil keluarga',
        features: null,
        is_available: true
      },
      {
        name: 'Innova',
        brand: 'Toyota',
        model: 'Innova Reborn',
        year: 2021,
        image_url: 'https://example.com/innova.jpg',
        rental_price_per_day: '450000',
        transmission: 'automatic',
        fuel_type: 'diesel',
        seats: 8,
        description: 'MPV premium',
        features: null,
        is_available: true
      },
      {
        name: 'Calya',
        brand: 'Toyota',
        model: 'Calya G',
        year: 2019,
        image_url: 'https://example.com/calya.jpg',
        rental_price_per_day: '280000',
        transmission: 'manual',
        fuel_type: 'gasoline',
        seats: 7,
        description: 'LCGC keluarga',
        features: null,
        is_available: true
      }
    ]).execute();

    const result = await getCarBrands();
    
    // Should only return Toyota once, not three times
    expect(result).toEqual(['Toyota']);
    expect(result).toHaveLength(1);
  });

  it('should include brands from both available and unavailable cars', async () => {
    // Create cars with different availability status
    await db.insert(carsTable).values([
      {
        name: 'Available Car',
        brand: 'Toyota',
        model: 'Avanza',
        year: 2020,
        image_url: 'https://example.com/avanza.jpg',
        rental_price_per_day: '350000',
        transmission: 'manual',
        fuel_type: 'gasoline',
        seats: 7,
        description: 'Available car',
        features: null,
        is_available: true
      },
      {
        name: 'Unavailable Car',
        brand: 'Honda',
        model: 'Jazz',
        year: 2019,
        image_url: 'https://example.com/jazz.jpg',
        rental_price_per_day: '300000',
        transmission: 'automatic',
        fuel_type: 'gasoline',
        seats: 5,
        description: 'Unavailable car',
        features: null,
        is_available: false
      }
    ]).execute();

    const result = await getCarBrands();
    
    // Should return both brands regardless of availability
    expect(result).toEqual(['Honda', 'Toyota']);
    expect(result).toHaveLength(2);
  });
});