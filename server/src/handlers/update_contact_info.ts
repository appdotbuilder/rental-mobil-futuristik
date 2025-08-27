import { db } from '../db';
import { contactInfoTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateContactInfoInput, type ContactInfo } from '../schema';

export const updateContactInfo = async (input: UpdateContactInfoInput): Promise<ContactInfo | null> => {
  try {
    // Check if contact info exists
    const existing = await db.select()
      .from(contactInfoTable)
      .where(eq(contactInfoTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      return null;
    }

    // Prepare update values, excluding id and only including defined fields
    const updateData: any = {
      updated_at: new Date()
    };

    // Only include fields that are defined in the input
    if (input.company_name !== undefined) updateData.company_name = input.company_name;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.whatsapp_number !== undefined) updateData.whatsapp_number = input.whatsapp_number;
    if (input.facebook_url !== undefined) updateData.facebook_url = input.facebook_url;
    if (input.instagram_url !== undefined) updateData.instagram_url = input.instagram_url;
    if (input.business_hours !== undefined) updateData.business_hours = input.business_hours;

    // Update the contact info record
    const result = await db.update(contactInfoTable)
      .set(updateData)
      .where(eq(contactInfoTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Contact info update failed:', error);
    throw error;
  }
};