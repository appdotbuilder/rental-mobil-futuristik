import { db } from '../db';
import { carsTable, contactInfoTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type WhatsappMessageInput, type WhatsappMessageResponse } from '../schema';

export const generateWhatsappMessage = async (input: WhatsappMessageInput): Promise<WhatsappMessageResponse> => {
  try {
    // Fetch car details
    const carResults = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, input.car_id))
      .execute();

    if (carResults.length === 0) {
      throw new Error(`Car with ID ${input.car_id} not found`);
    }

    const car = carResults[0];
    
    // Convert numeric field to number
    const carData = {
      ...car,
      rental_price_per_day: parseFloat(car.rental_price_per_day)
    };

    // Fetch contact info (get the first/default record)
    const contactResults = await db.select()
      .from(contactInfoTable)
      .limit(1)
      .execute();

    if (contactResults.length === 0) {
      throw new Error('Contact information not found');
    }

    const contactInfo = contactResults[0];

    // Calculate rental duration
    const startDate = new Date(input.rental_start_date);
    const endDate = new Date(input.rental_end_date);
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = duration * carData.rental_price_per_day;

    // Format professional WhatsApp message in Indonesian
    const message = `Halo ${contactInfo.company_name}! 👋

Saya tertarik untuk menyewa mobil dengan detail sebagai berikut:

👤 *Data Penyewa:*
• Nama: ${input.customer_name}
• No. HP: ${input.customer_phone}

🚗 *Detail Mobil:*
• Mobil: ${carData.name}
• Merek: ${carData.brand} ${carData.model}
• Tahun: ${carData.year}
• Transmisi: ${carData.transmission === 'automatic' ? 'Otomatis' : 'Manual'}
• Bahan Bakar: ${formatFuelType(carData.fuel_type)}
• Kapasitas: ${carData.seats} kursi

📅 *Jadwal Sewa:*
• Tanggal Mulai: ${formatDate(startDate)}
• Tanggal Selesai: ${formatDate(endDate)}
• Durasi: ${duration} hari

💰 *Estimasi Biaya:*
• Harga per hari: Rp ${carData.rental_price_per_day.toLocaleString('id-ID')}
• Total estimasi: Rp ${totalPrice.toLocaleString('id-ID')} (${duration} hari)

${input.additional_message ? `📝 *Catatan Tambahan:*
${input.additional_message}

` : ''}Mohon informasi lebih lanjut mengenai ketersediaan mobil dan prosedur penyewaan. Terima kasih! 🙏`;

    // Clean WhatsApp number (remove any non-digit characters and ensure it starts with country code)
    let whatsappNumber = contactInfo.whatsapp_number.replace(/\D/g, '');
    if (whatsappNumber.startsWith('0')) {
      whatsappNumber = '62' + whatsappNumber.substring(1);
    } else if (!whatsappNumber.startsWith('62')) {
      whatsappNumber = '62' + whatsappNumber;
    }

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    return {
      whatsapp_url: whatsappUrl,
      message: message
    };
  } catch (error) {
    console.error('WhatsApp message generation failed:', error);
    throw error;
  }
};

// Helper function to format fuel type in Indonesian
const formatFuelType = (fuelType: string): string => {
  const fuelTypeMap: { [key: string]: string } = {
    'gasoline': 'Bensin',
    'diesel': 'Solar',
    'electric': 'Listrik',
    'hybrid': 'Hybrid'
  };
  return fuelTypeMap[fuelType] || fuelType;
};

// Helper function to format date in Indonesian
const formatDate = (date: Date): string => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};