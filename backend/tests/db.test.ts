import { initDatabase, getDb, seedDatabase } from '../src/db/sqlite.js';

describe('SQLite Database Layer', () => {
  beforeAll(() => {
    initDatabase(':memory:');
    seedDatabase();
  });

  afterAll(() => {
    const db = getDb();
    db.close();
  });

  it('should seed 15 customer personas', () => {
    const db = getDb();
    const customers = db.prepare('SELECT * FROM customers').all();
    expect(customers.length).toBe(15);
  });

  it('should seed orders and order items', () => {
    const db = getDb();
    const orders = db.prepare('SELECT * FROM orders').all();
    const items = db.prepare('SELECT * FROM order_items').all();
    expect(orders.length).toBeGreaterThanOrEqual(15);
    expect(items.length).toBeGreaterThanOrEqual(15);
  });

  it('should contain specific test scenarios like final sale and high value', () => {
    const db = getDb();
    const finalSale = db.prepare('SELECT * FROM order_items WHERE is_final_sale = 1').all();
    const highValue = db.prepare('SELECT * FROM orders WHERE total_amount > 500').all();
    expect(finalSale.length).toBeGreaterThan(0);
    expect(highValue.length).toBeGreaterThan(0);
  });
});
