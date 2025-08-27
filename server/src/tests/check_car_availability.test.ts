import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { type CarAvailabilityInput } from '../schema';
import { checkCarAvailability } from '../handlers/check_car_availability';

// Helper function to get dates
const getTomorrowDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
};

const getDayAfterTomorrowDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  return date.toISOString().split('T')[0];
};

const getYesterdayDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
};

const getTodayDate = () => {
  const date = new Date();
  return date.toISOString().split('T')[0];
};

// Test car data
const testCarData = {
  name: 'Toyota Avanza',
  brand: 'Toyota',
  model: 'Avanza',
  year: 2023,
  image_url: 'https://example.com/avanza.jpg',
  rental_price_per_day: '350000',
  transmission: 'manual' as const,
  fuel_type: 'gasoline' as const,
  seats: 7,
  description: 'Mobil keluarga yang nyaman',
  features: '["AC", "Audio System", "Power Steering"]',
  is_available: true
};

const unavailableCarData = {
  ...testCarData,
  name: 'Honda Civic',
  brand: 'Honda',
  model: 'Civic',
  is_available: false
};

describe('checkCarAvailability', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return available for valid car and date range', async () => {
    // Create test car
    const result = await db.insert(carsTable)
      .values(testCarData)
      .returning()
      .execute();
    
    const carId = result[0].id;

    const input: CarAvailabilityInput = {
      car_id: carId,
      start_date: getTomorrowDate(),
      end_date: getDayAfterTomorrowDate()
    };

    const availability = await checkCarAvailability(input);

    expect(availability.car_id).toEqual(carId);
    expect(availability.is_available).toBe(true);
    expect(availability.message).toContain('Toyota Avanza tersedia untuk disewa selama 1 hari');
  });

  it('should return not available for non-existent car', async () => {
    const input: CarAvailabilityInput = {
      car_id: 999, // Non-existent car ID
      start_date: getTomorrowDate(),
      end_date: getDayAfterTomorrowDate()
    };

    const availability = await checkCarAvailability(input);

    expect(availability.car_id).toEqual(999);
    expect(availability.is_available).toBe(false);
    expect(availability.message).toEqual('Mobil tidak ditemukan');
  });

  it('should return not available for car marked as unavailable', async () => {
    // Create unavailable test car
    const result = await db.insert(carsTable)
      .values(unavailableCarData)
      .returning()
      .execute();
    
    const carId = result[0].id;

    const input: CarAvailabilityInput = {
      car_id: carId,
      start_date: getTomorrowDate(),
      end_date: getDayAfterTomorrowDate()
    };

    const availability = await checkCarAvailability(input);

    expect(availability.car_id).toEqual(carId);
    expect(availability.is_available).toBe(false);
    expect(availability.message).toEqual('Mobil sedang tidak tersedia untuk disewa');
  });

  it('should return not available for invalid date format', async () => {
    // Create test car
    const result = await db.insert(carsTable)
      .values(testCarData)
      .returning()
      .execute();
    
    const carId = result[0].id;

    const input: CarAvailabilityInput = {
      car_id: carId,
      start_date: 'invalid-date',
      end_date: getDayAfterTomorrowDate()
    };

    const availability = await checkCarAvailability(input);

    expect(availability.car_id).toEqual(carId);
    expect(availability.is_available).toBe(false);
    expect(availability.message).toEqual('Format tanggal tidak valid');
  });

  it('should return not available when start date is after end date', async () => {
    // Create test car
    const result = await db.insert(carsTable)
      .values(testCarData)
      .returning()
      .execute();
    
    const carId = result[0].id;

    const input: CarAvailabilityInput = {
      car_id: carId,
      start_date: getDayAfterTomorrowDate(),
      end_date: getTomorrowDate() // End date before start date
    };

    const availability = await checkCarAvailability(input);

    expect(availability.car_id).toEqual(carId);
    expect(availability.is_available).toBe(false);
    expect(availability.message).toEqual('Tanggal mulai harus sebelum tanggal selesai');
  });

  it('should return not available when start date is same as end date', async () => {
    // Create test car
    const result = await db.insert(carsTable)
      .values(testCarData)
      .returning()
      .execute();
    
    const carId = result[0].id;

    const sameDate = getTomorrowDate();
    const input: CarAvailabilityInput = {
      car_id: carId,
      start_date: sameDate,
      end_date: sameDate
    };

    const availability = await checkCarAvailability(input);

    expect(availability.car_id).toEqual(carId);
    expect(availability.is_available).toBe(false);
    expect(availability.message).toEqual('Tanggal mulai harus sebelum tanggal selesai');
  });

  it('should return not available for past dates', async () => {
    // Create test car
    const result = await db.insert(carsTable)
      .values(testCarData)
      .returning()
      .execute();
    
    const carId = result[0].id;

    const input: CarAvailabilityInput = {
      car_id: carId,
      start_date: getYesterdayDate(), // Past date
      end_date: getTomorrowDate()
    };

    const availability = await checkCarAvailability(input);

    expect(availability.car_id).toEqual(carId);
    expect(availability.is_available).toBe(false);
    expect(availability.message).toEqual('Tanggal mulai tidak boleh di masa lalu');
  });

  it('should allow booking starting from today', async () => {
    // Create test car
    const result = await db.insert(carsTable)
      .values(testCarData)
      .returning()
      .execute();
    
    const carId = result[0].id;

    const input: CarAvailabilityInput = {
      car_id: carId,
      start_date: getTodayDate(), // Today's date
      end_date: getTomorrowDate()
    };

    const availability = await checkCarAvailability(input);

    expect(availability.car_id).toEqual(carId);
    expect(availability.is_available).toBe(true);
    expect(availability.message).toContain('Toyota Avanza tersedia untuk disewa selama 1 hari');
  });

  it('should calculate rental duration correctly for multiple days', async () => {
    // Create test car
    const result = await db.insert(carsTable)
      .values(testCarData)
      .returning()
      .execute();
    
    const carId = result[0].id;

    // Create a 7-day rental period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 8); // 7 days later

    const input: CarAvailabilityInput = {
      car_id: carId,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    };

    const availability = await checkCarAvailability(input);

    expect(availability.car_id).toEqual(carId);
    expect(availability.is_available).toBe(true);
    expect(availability.message).toContain('Toyota Avanza tersedia untuk disewa selama 7 hari');
  });

  it('should handle edge case with long rental periods', async () => {
    // Create test car
    const result = await db.insert(carsTable)
      .values(testCarData)
      .returning()
      .execute();
    
    const carId = result[0].id;

    // Create a 30-day rental period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 31); // 30 days later

    const input: CarAvailabilityInput = {
      car_id: carId,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    };

    const availability = await checkCarAvailability(input);

    expect(availability.car_id).toEqual(carId);
    expect(availability.is_available).toBe(true);
    expect(availability.message).toContain('Toyota Avanza tersedia untuk disewa selama 30 hari');
  });
});