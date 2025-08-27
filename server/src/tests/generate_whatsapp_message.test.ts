import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { carsTable, contactInfoTable } from '../db/schema';
import { type WhatsappMessageInput } from '../schema';
import { generateWhatsappMessage } from '../handlers/generate_whatsapp_message';

// Test data
const testCar = {
  name: 'Toyota Avanza Premium',
  brand: 'Toyota',
  model: 'Avanza',
  year: 2023,
  image_url: 'https://example.com/avanza.jpg',
  rental_price_per_day: '350000',
  transmission: 'automatic' as const,
  fuel_type: 'gasoline' as const,
  seats: 7,
  description: 'Mobil keluarga yang nyaman',
  features: '["AC", "Audio System", "Power Steering"]',
  is_available: true
};

const testContactInfo = {
  company_name: 'Rental Mobil Sejahtera',
  phone: '021-12345678',
  email: 'info@rentalsejahtera.com',
  address: 'Jl. Raya No. 123, Jakarta',
  whatsapp_number: '081234567890',
  facebook_url: 'https://facebook.com/rentalsejahtera',
  instagram_url: 'https://instagram.com/rentalsejahtera',
  business_hours: '08:00 - 20:00 WIB'
};

const testInput: WhatsappMessageInput = {
  car_id: 1,
  customer_name: 'John Doe',
  customer_phone: '08123456789',
  rental_start_date: '2024-01-15',
  rental_end_date: '2024-01-17',
  additional_message: 'Saya butuh mobil untuk liburan keluarga'
};

describe('generateWhatsappMessage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate WhatsApp message with car and contact details', async () => {
    // Create test data
    const carResults = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();

    await db.insert(contactInfoTable)
      .values(testContactInfo)
      .returning()
      .execute();

    const carId = carResults[0].id;
    const input = { ...testInput, car_id: carId };

    const result = await generateWhatsappMessage(input);

    // Verify response structure
    expect(typeof result.whatsapp_url).toBe('string');
    expect(typeof result.message).toBe('string');

    // Verify WhatsApp URL format
    expect(result.whatsapp_url).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
    expect(result.whatsapp_url).toContain('6281234567890'); // Formatted phone number

    // Verify message contains all required information
    expect(result.message).toContain('Rental Mobil Sejahtera');
    expect(result.message).toContain('John Doe');
    expect(result.message).toContain('08123456789');
    expect(result.message).toContain('Toyota Avanza Premium');
    expect(result.message).toContain('Toyota Avanza');
    expect(result.message).toContain('2023');
    expect(result.message).toContain('Otomatis'); // Translated transmission
    expect(result.message).toContain('Bensin'); // Translated fuel type
    expect(result.message).toContain('7 kursi');
    expect(result.message).toContain('15 Januari 2024'); // Formatted start date
    expect(result.message).toContain('17 Januari 2024'); // Formatted end date
    expect(result.message).toContain('2 hari'); // Duration calculation
    expect(result.message).toContain('Rp 350.000'); // Formatted price
    expect(result.message).toContain('Rp 700.000'); // Total price (2 days × 350000)
    expect(result.message).toContain('Saya butuh mobil untuk liburan keluarga');
  });

  it('should generate message without additional message when not provided', async () => {
    // Create test data
    const carResults = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();

    await db.insert(contactInfoTable)
      .values(testContactInfo)
      .returning()
      .execute();

    const carId = carResults[0].id;
    const inputWithoutAdditionalMessage = {
      car_id: carId,
      customer_name: 'Jane Doe',
      customer_phone: '08987654321',
      rental_start_date: '2024-02-01',
      rental_end_date: '2024-02-05'
    };

    const result = await generateWhatsappMessage(inputWithoutAdditionalMessage);

    // Should not contain "Catatan Tambahan" section
    expect(result.message).not.toContain('📝 *Catatan Tambahan:*');
    expect(result.message).toContain('Jane Doe');
    expect(result.message).toContain('4 hari'); // 5-1 = 4 days
  });

  it('should handle different fuel types correctly', async () => {
    const dieselCar = {
      ...testCar,
      name: 'Isuzu Panther',
      brand: 'Isuzu',
      model: 'Panther',
      fuel_type: 'diesel' as const,
      transmission: 'manual' as const
    };

    const carResults = await db.insert(carsTable)
      .values(dieselCar)
      .returning()
      .execute();

    await db.insert(contactInfoTable)
      .values(testContactInfo)
      .returning()
      .execute();

    const carId = carResults[0].id;
    const input = { ...testInput, car_id: carId };

    const result = await generateWhatsappMessage(input);

    expect(result.message).toContain('Solar'); // Diesel translated to Solar
    expect(result.message).toContain('Manual'); // Manual transmission
  });

  it('should handle electric and hybrid fuel types', async () => {
    const electricCar = {
      ...testCar,
      name: 'Tesla Model 3',
      brand: 'Tesla',
      model: 'Model 3',
      fuel_type: 'electric' as const
    };

    const carResults = await db.insert(carsTable)
      .values(electricCar)
      .returning()
      .execute();

    await db.insert(contactInfoTable)
      .values(testContactInfo)
      .returning()
      .execute();

    const carId = carResults[0].id;
    const input = { ...testInput, car_id: carId };

    const result = await generateWhatsappMessage(input);

    expect(result.message).toContain('Listrik'); // Electric translated
  });

  it('should format WhatsApp number correctly for Indonesian numbers', async () => {
    const contactWithLocalNumber = {
      ...testContactInfo,
      whatsapp_number: '0812-3456-7890' // Local format with dashes
    };

    const carResults = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();

    await db.insert(contactInfoTable)
      .values(contactWithLocalNumber)
      .returning()
      .execute();

    const carId = carResults[0].id;
    const input = { ...testInput, car_id: carId };

    const result = await generateWhatsappMessage(input);

    // Should convert 0812-3456-7890 to 6281234567890 (keeping all digits after country code conversion)
    expect(result.whatsapp_url).toContain('6281234567890');
  });

  it('should handle WhatsApp number that already has country code', async () => {
    const contactWithCountryCode = {
      ...testContactInfo,
      whatsapp_number: '628123456789'
    };

    const carResults = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();

    await db.insert(contactInfoTable)
      .values(contactWithCountryCode)
      .returning()
      .execute();

    const carId = carResults[0].id;
    const input = { ...testInput, car_id: carId };

    const result = await generateWhatsappMessage(input);

    expect(result.whatsapp_url).toContain('628123456789');
  });

  it('should calculate rental duration and total cost correctly', async () => {
    const carResults = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();

    await db.insert(contactInfoTable)
      .values(testContactInfo)
      .returning()
      .execute();

    const carId = carResults[0].id;
    
    // Test with longer rental period
    const longRentalInput = {
      ...testInput,
      car_id: carId,
      rental_start_date: '2024-03-01',
      rental_end_date: '2024-03-08' // 7 days
    };

    const result = await generateWhatsappMessage(longRentalInput);

    expect(result.message).toContain('7 hari');
    expect(result.message).toContain('Rp 2.450.000'); // 7 × 350000 = 2,450,000
  });

  it('should throw error when car not found', async () => {
    await db.insert(contactInfoTable)
      .values(testContactInfo)
      .returning()
      .execute();

    const input = { ...testInput, car_id: 999 }; // Non-existent car ID

    await expect(generateWhatsappMessage(input)).rejects.toThrow(/Car with ID 999 not found/i);
  });

  it('should throw error when contact info not found', async () => {
    const carResults = await db.insert(carsTable)
      .values(testCar)
      .returning()
      .execute();

    const carId = carResults[0].id;
    const input = { ...testInput, car_id: carId };

    // No contact info inserted
    await expect(generateWhatsappMessage(input)).rejects.toThrow(/Contact information not found/i);
  });

  it('should handle numeric price conversion correctly', async () => {
    const expensiveCar = {
      ...testCar,
      name: 'BMW X5',
      brand: 'BMW',
      model: 'X5',
      rental_price_per_day: '1500000.50' // With decimal
    };

    const carResults = await db.insert(carsTable)
      .values(expensiveCar)
      .returning()
      .execute();

    await db.insert(contactInfoTable)
      .values(testContactInfo)
      .returning()
      .execute();

    const carId = carResults[0].id;
    const input = { ...testInput, car_id: carId };

    const result = await generateWhatsappMessage(input);

    expect(result.message).toContain('Rp 1.500.000,5'); // Proper Indonesian number format
    expect(result.message).toContain('Rp 3.000.001'); // Total for 2 days (rounded)
  });
});