import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactInfoTable } from '../db/schema';
import { getContactInfo } from '../handlers/get_contact_info';

// Test contact info data
const testContactInfo = {
  company_name: 'Test Car Rental',
  phone: '+62-123-456-7890',
  email: 'info@testcarrental.com',
  address: 'Jl. Test No. 123, Jakarta',
  whatsapp_number: '+62-123-456-7890',
  facebook_url: 'https://facebook.com/testcarrental',
  instagram_url: 'https://instagram.com/testcarrental',
  business_hours: 'Mon-Sun: 08:00-22:00'
};

describe('getContactInfo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return contact info when it exists', async () => {
    // Create contact info record
    const insertResult = await db.insert(contactInfoTable)
      .values(testContactInfo)
      .returning()
      .execute();

    const result = await getContactInfo();

    // Verify the result is not null
    expect(result).not.toBeNull();
    expect(result!.id).toBeDefined();
    expect(result!.company_name).toEqual('Test Car Rental');
    expect(result!.phone).toEqual('+62-123-456-7890');
    expect(result!.email).toEqual('info@testcarrental.com');
    expect(result!.address).toEqual('Jl. Test No. 123, Jakarta');
    expect(result!.whatsapp_number).toEqual('+62-123-456-7890');
    expect(result!.facebook_url).toEqual('https://facebook.com/testcarrental');
    expect(result!.instagram_url).toEqual('https://instagram.com/testcarrental');
    expect(result!.business_hours).toEqual('Mon-Sun: 08:00-22:00');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when no contact info exists', async () => {
    const result = await getContactInfo();

    expect(result).toBeNull();
  });

  it('should return only the first contact info record when multiple exist', async () => {
    // Create first contact info record
    await db.insert(contactInfoTable)
      .values({
        ...testContactInfo,
        company_name: 'First Car Rental'
      })
      .execute();

    // Create second contact info record
    await db.insert(contactInfoTable)
      .values({
        ...testContactInfo,
        company_name: 'Second Car Rental'
      })
      .execute();

    const result = await getContactInfo();

    // Should return the first record (lowest ID)
    expect(result).not.toBeNull();
    expect(result!.company_name).toEqual('First Car Rental');
  });

  it('should handle contact info with nullable fields', async () => {
    // Create contact info with null optional fields
    const contactInfoWithNulls = {
      ...testContactInfo,
      facebook_url: null,
      instagram_url: null
    };

    await db.insert(contactInfoTable)
      .values(contactInfoWithNulls)
      .execute();

    const result = await getContactInfo();

    expect(result).not.toBeNull();
    expect(result!.company_name).toEqual('Test Car Rental');
    expect(result!.facebook_url).toBeNull();
    expect(result!.instagram_url).toBeNull();
    expect(result!.phone).toEqual('+62-123-456-7890');
    expect(result!.email).toEqual('info@testcarrental.com');
  });

  it('should verify database record matches returned data', async () => {
    // Create contact info record
    const insertResult = await db.insert(contactInfoTable)
      .values(testContactInfo)
      .returning()
      .execute();

    const result = await getContactInfo();

    // Verify the returned data matches what's in the database
    const dbRecord = insertResult[0];
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(dbRecord.id);
    expect(result!.company_name).toEqual(dbRecord.company_name);
    expect(result!.phone).toEqual(dbRecord.phone);
    expect(result!.email).toEqual(dbRecord.email);
    expect(result!.address).toEqual(dbRecord.address);
    expect(result!.whatsapp_number).toEqual(dbRecord.whatsapp_number);
    expect(result!.facebook_url).toEqual(dbRecord.facebook_url);
    expect(result!.instagram_url).toEqual(dbRecord.instagram_url);
    expect(result!.business_hours).toEqual(dbRecord.business_hours);
    expect(result!.created_at).toEqual(dbRecord.created_at);
    expect(result!.updated_at).toEqual(dbRecord.updated_at);
  });
});