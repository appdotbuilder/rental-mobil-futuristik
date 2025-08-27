import { db } from '../db';
import { carsTable } from '../db/schema';
import { type Car, type CarFilter } from '../schema';
import { and, gte, lte, eq, asc, desc } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const getCars = async (filter?: CarFilter): Promise<Car[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter) {
      // Filter by brand
      if (filter.brand) {
        conditions.push(eq(carsTable.brand, filter.brand));
      }

      // Filter by transmission
      if (filter.transmission) {
        conditions.push(eq(carsTable.transmission, filter.transmission));
      }

      // Filter by fuel type
      if (filter.fuel_type) {
        conditions.push(eq(carsTable.fuel_type, filter.fuel_type));
      }

      // Filter by minimum price
      if (filter.min_price !== undefined) {
        conditions.push(gte(carsTable.rental_price_per_day, filter.min_price.toString()));
      }

      // Filter by maximum price
      if (filter.max_price !== undefined) {
        conditions.push(lte(carsTable.rental_price_per_day, filter.max_price.toString()));
      }

      // Filter by minimum seats
      if (filter.min_seats !== undefined) {
        conditions.push(gte(carsTable.seats, filter.min_seats));
      }

      // Filter by maximum seats
      if (filter.max_seats !== undefined) {
        conditions.push(lte(carsTable.seats, filter.max_seats));
      }

      // Filter by availability
      if (filter.is_available !== undefined) {
        conditions.push(eq(carsTable.is_available, filter.is_available));
      }
    }

    // Build final query with all clauses
    const baseQuery = db.select().from(carsTable);
    
    const queryWithFilters = conditions.length > 0
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    const finalQuery = queryWithFilters.orderBy(desc(carsTable.created_at));

    const results = await finalQuery.execute();

    // Convert numeric fields back to numbers for proper typing
    return results.map(car => ({
      ...car,
      rental_price_per_day: parseFloat(car.rental_price_per_day)
    }));
  } catch (error) {
    console.error('Failed to fetch cars:', error);
    throw error;
  }
};