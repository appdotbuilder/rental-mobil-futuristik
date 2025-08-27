import { type WhatsappMessageInput, type WhatsappMessageResponse } from '../schema';

export const generateWhatsappMessage = async (input: WhatsappMessageInput): Promise<WhatsappMessageResponse> => {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is generating a pre-filled WhatsApp message URL for car rental inquiries.
    // Should fetch car details, format a professional message in Indonesian, and create WhatsApp URL
    // Message should include: car name, rental dates, customer info, and rental details
    
    const dummyMessage = `Halo! Saya tertarik untuk menyewa mobil dengan detail sebagai berikut:
    
👤 Nama: ${input.customer_name}
📱 No. HP: ${input.customer_phone}
📅 Tanggal Mulai: ${input.rental_start_date}
📅 Tanggal Selesai: ${input.rental_end_date}
🚗 ID Mobil: ${input.car_id}

${input.additional_message ? `Catatan: ${input.additional_message}` : ''}

Mohon informasi lebih lanjut mengenai ketersediaan dan prosedur penyewaan. Terima kasih!`;

    return {
        whatsapp_url: `https://wa.me/6281234567890?text=${encodeURIComponent(dummyMessage)}`,
        message: dummyMessage
    };
};