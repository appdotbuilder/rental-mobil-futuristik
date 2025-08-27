import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactInfoTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateContactInfoInput } from '../schema';
import { updateContactInfo } from '../handlers/update_contact_info';

// Test data for contact info
const testContactInfo = {
  company_name: 'Test Car Rental',
  phone: '+62-812-3456-7890',
  email: 'test@carrental.com',
  address: 'Jl. Test No. 123, Jakarta',
  whatsapp_number: '+62-812-3456-7890',
  facebook_url: 'https://facebook.com/testcarrental',
  instagram_url: 'https://instagram.com/testcarrental',
  business_hours: '08:00 - 17:00'
};

describe('updateContactInfo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update contact info successfully', async () => {
    // Create initial contact info
    const created = await db.insert(contactInfoTable)
      .values(testContactInfo)
      .returning()
      .execute();

    const contactId = created[0].id;

    const updateInput: UpdateContactInfoInput = {
      id: contactId,
      company_name: 'Updated Car Rental Company',
      phone: '+62-813-7654-3210',
      email: 'updated@carrental.com'
    };

    const result = await updateContactInfo(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(contactId);
    expect(result!.company_name).toEqual('Updated Car Rental Company');
    expect(result!.phone).toEqual('+62-813-7654-3210');
    expect(result!.email).toEqual('updated@carrental.com');
    
    // Check that unchanged fields remain the same
    expect(result!.address).toEqual(testContactInfo.address);
    expect(result!.whatsapp_number).toEqual(testContactInfo.whatsapp_number);
    expect(result!.facebook_url).toEqual(testContactInfo.facebook_url);
    expect(result!.instagram_url).toEqual(testContactInfo.instagram_url);
    expect(result!.business_hours).toEqual(testContactInfo.business_hours);
    
    // Check timestamps
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(result!.created_at.getTime());
  });

  it('should update nullable fields to null', async () => {
    // Create initial contact info
    const created = await db.insert(contactInfoTable)
      .values(testContactInfo)
      .returning()
      .execute();

    const contactId = created[0].id;

    const updateInput: UpdateContactInfoInput = {
      id: contactId,
      facebook_url: null,
      instagram_url: null
    };

    const result = await updateContactInfo(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(contactId);
    expect(result!.facebook_url).toBeNull();
    expect(result!.instagram_url).toBeNull();
    
    // Check that other fields remain unchanged
    expect(result!.company_name).toEqual(testContactInfo.company_name);
    expect(result!.phone).toEqual(testContactInfo.phone);
    expect(result!.email).toEqual(testContactInfo.email);
  });

  it('should update only specific fields when partial input provided', async () => {
    // Create initial contact info
    const created = await db.insert(contactInfoTable)
      .values(testContactInfo)
      .returning()
      .execute();

    const contactId = created[0].id;

    const updateInput: UpdateContactInfoInput = {
      id: contactId,
      business_hours: '09:00 - 18:00'
    };

    const result = await updateContactInfo(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(contactId);
    expect(result!.business_hours).toEqual('09:00 - 18:00');
    
    // All other fields should remain unchanged
    expect(result!.company_name).toEqual(testContactInfo.company_name);
    expect(result!.phone).toEqual(testContactInfo.phone);
    expect(result!.email).toEqual(testContactInfo.email);
    expect(result!.address).toEqual(testContactInfo.address);
    expect(result!.whatsapp_number).toEqual(testContactInfo.whatsapp_number);
    expect(result!.facebook_url).toEqual(testContactInfo.facebook_url);
    expect(result!.instagram_url).toEqual(testContactInfo.instagram_url);
  });

  it('should return null when contact info does not exist', async () => {
    const updateInput: UpdateContactInfoInput = {
      id: 999, // Non-existent ID
      company_name: 'Non-existent Company'
    };

    const result = await updateContactInfo(updateInput);

    expect(result).toBeNull();
  });

  it('should save changes to database', async () => {
    // Create initial contact info
    const created = await db.insert(contactInfoTable)
      .values(testContactInfo)
      .returning()
      .execute();

    const contactId = created[0].id;

    const updateInput: UpdateContactInfoInput = {
      id: contactId,
      company_name: 'Database Updated Company',
      email: 'database@updated.com'
    };

    await updateContactInfo(updateInput);

    // Verify changes in database
    const saved = await db.select()
      .from(contactInfoTable)
      .where(eq(contactInfoTable.id, contactId))
      .execute();

    expect(saved).toHaveLength(1);
    expect(saved[0].company_name).toEqual('Database Updated Company');
    expect(saved[0].email).toEqual('database@updated.com');
    expect(saved[0].phone).toEqual(testContactInfo.phone); // Unchanged
  });

  it('should update all fields when full input provided', async () => {
    // Create initial contact info
    const created = await db.insert(contactInfoTable)
      .values(testContactInfo)
      .returning()
      .execute();

    const contactId = created[0].id;

    const updateInput: UpdateContactInfoInput = {
      id: contactId,
      company_name: 'Fully Updated Rental',
      phone: '+62-821-9876-5432',
      email: 'fully@updated.com',
      address: 'Jl. Updated No. 456, Bandung',
      whatsapp_number: '+62-821-9876-5432',
      facebook_url: 'https://facebook.com/fullyupdated',
      instagram_url: 'https://instagram.com/fullyupdated',
      business_hours: '07:00 - 19:00'
    };

    const result = await updateContactInfo(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(contactId);
    expect(result!.company_name).toEqual('Fully Updated Rental');
    expect(result!.phone).toEqual('+62-821-9876-5432');
    expect(result!.email).toEqual('fully@updated.com');
    expect(result!.address).toEqual('Jl. Updated No. 456, Bandung');
    expect(result!.whatsapp_number).toEqual('+62-821-9876-5432');
    expect(result!.facebook_url).toEqual('https://facebook.com/fullyupdated');
    expect(result!.instagram_url).toEqual('https://instagram.com/fullyupdated');
    expect(result!.business_hours).toEqual('07:00 - 19:00');
    
    // Timestamp should be updated
    expect(result!.updated_at.getTime()).toBeGreaterThan(result!.created_at.getTime());
  });

  it('should handle empty string values correctly', async () => {
    // Create initial contact info
    const created = await db.insert(contactInfoTable)
      .values(testContactInfo)
      .returning()
      .execute();

    const contactId = created[0].id;

    // Note: Empty strings should still pass validation in the schema
    const updateInput: UpdateContactInfoInput = {
      id: contactId,
      company_name: 'Company With Empty Social',
      facebook_url: null, // Setting to null
      instagram_url: null  // Setting to null
    };

    const result = await updateContactInfo(updateInput);

    expect(result).toBeDefined();
    expect(result!.company_name).toEqual('Company With Empty Social');
    expect(result!.facebook_url).toBeNull();
    expect(result!.instagram_url).toBeNull();
  });
});