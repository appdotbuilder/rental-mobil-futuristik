import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createCarInputSchema, 
  updateCarInputSchema, 
  updateContactInfoInputSchema,
  carFilterSchema,
  whatsappMessageInputSchema,
  carAvailabilityInputSchema
} from './schema';

// Import handlers
import { getCars } from './handlers/get_cars';
import { getCarById } from './handlers/get_car_by_id';
import { createCar } from './handlers/create_car';
import { updateCar } from './handlers/update_car';
import { deleteCar } from './handlers/delete_car';
import { getContactInfo } from './handlers/get_contact_info';
import { updateContactInfo } from './handlers/update_contact_info';
import { generateWhatsappMessage } from './handlers/generate_whatsapp_message';
import { checkCarAvailability } from './handlers/check_car_availability';
import { getCarBrands } from './handlers/get_car_brands';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Car management routes
  getCars: publicProcedure
    .input(carFilterSchema.optional())
    .query(({ input }) => getCars(input)),

  getCarById: publicProcedure
    .input(z.number())
    .query(({ input }) => getCarById(input)),

  createCar: publicProcedure
    .input(createCarInputSchema)
    .mutation(({ input }) => createCar(input)),

  updateCar: publicProcedure
    .input(updateCarInputSchema)
    .mutation(({ input }) => updateCar(input)),

  deleteCar: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteCar(input)),

  getCarBrands: publicProcedure
    .query(() => getCarBrands()),

  // Contact information routes
  getContactInfo: publicProcedure
    .query(() => getContactInfo()),

  updateContactInfo: publicProcedure
    .input(updateContactInfoInputSchema)
    .mutation(({ input }) => updateContactInfo(input)),

  // WhatsApp integration routes
  generateWhatsappMessage: publicProcedure
    .input(whatsappMessageInputSchema)
    .mutation(({ input }) => generateWhatsappMessage(input)),

  // Car availability routes
  checkCarAvailability: publicProcedure
    .input(carAvailabilityInputSchema)
    .query(({ input }) => checkCarAvailability(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();