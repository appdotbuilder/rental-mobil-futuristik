import { db } from '../db';
import { carsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CarAvailabilityInput, type CarAvailabilityResponse } from '../schema';

export const checkCarAvailability = async (input: CarAvailabilityInput): Promise<CarAvailabilityResponse> => {
  try {
    // Validate date format and logic
    const startDate = new Date(input.start_date);
    const endDate = new Date(input.end_date);

    // Check if dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return {
        car_id: input.car_id,
        is_available: false,
        message: 'Format tanggal tidak valid'
      };
    }

    // Check if start date is before end date
    if (startDate >= endDate) {
      return {
        car_id: input.car_id,
        is_available: false,
        message: 'Tanggal mulai harus sebelum tanggal selesai'
      };
    }

    // Check if start date is not in the past (allow today)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    if (startDate < today) {
      return {
        car_id: input.car_id,
        is_available: false,
        message: 'Tanggal mulai tidak boleh di masa lalu'
      };
    }

    // Check if car exists in database
    const cars = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, input.car_id))
      .execute();

    if (cars.length === 0) {
      return {
        car_id: input.car_id,
        is_available: false,
        message: 'Mobil tidak ditemukan'
      };
    }

    const car = cars[0];

    // Check if car is available for rental
    if (!car.is_available) {
      return {
        car_id: input.car_id,
        is_available: false,
        message: 'Mobil sedang tidak tersedia untuk disewa'
      };
    }

    // Calculate rental duration
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // For now, assume car is available since we don't have a booking system
    // In a real implementation, this would check against existing bookings
    return {
      car_id: input.car_id,
      is_available: true,
      message: `Mobil ${car.name} tersedia untuk disewa selama ${diffDays} hari`
    };

  } catch (error) {
    console.error('Car availability check failed:', error);
    throw error;
  }
};