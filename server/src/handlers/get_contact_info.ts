import { db } from '../db';
import { contactInfoTable } from '../db/schema';
import { type ContactInfo } from '../schema';

export const getContactInfo = async (): Promise<ContactInfo | null> => {
  try {
    // Get the first contact info record (there should only be one)
    const results = await db.select()
      .from(contactInfoTable)
      .limit(1)
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Return the contact info record
    const contactInfo = results[0];
    return {
      ...contactInfo,
      // No numeric conversions needed as all fields are text, integer, or timestamp
    };
  } catch (error) {
    console.error('Failed to fetch contact info:', error);
    throw error;
  }
};