import request from 'supertest';
import { app } from '../src/server.js';
import { initDatabase, seedDatabase, getDb } from '../src/db/sqlite.js';

describe('AI Refund System REST API', () => {
  beforeAll(() => {
    initDatabase(':memory:');
    seedDatabase();
  });

  afterAll(() => {
    const db = getDb();
    db.close();
  });

  it('GET /api/customers - returns all 15 customer personas', async () => {
    const res = await request(app).get('/api/customers');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(15);
    expect(res.body.data.length).toBe(15);
  });

  it('GET /api/customers/:id - returns customer with order history', async () => {
    const res = await request(app).get('/api/customers/CUST-101');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Sarah Jenkins');
    expect(res.body.data.orders.length).toBeGreaterThan(0);
    expect(res.body.data.orders[0].items.length).toBeGreaterThan(0);
  });

  it('GET /api/policy/rules - returns active store refund policies', async () => {
    const res = await request(app).get('/api/policy/rules');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(5);
    const codes = res.body.data.map((p: any) => p.code);
    expect(codes).toContain('POL-001');
    expect(codes).toContain('POL-002');
    expect(codes).toContain('POL-003');
    expect(codes).toContain('POL-004');
    expect(codes).toContain('POL-005');
  });

  it('POST /api/refunds/evaluate - evaluates valid damaged cookware claim', async () => {
    const res = await request(app)
      .post('/api/refunds/evaluate')
      .send({
        customerId: 'CUST-101',
        orderId: 'ORD-901',
        message: 'The ceramic cookware lids arrived shattered in pieces.'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.decision).toBe('APPROVED');
    expect(res.body.data.ticketId).toBeTruthy();
    expect(res.body.data.policyClauses).toContain('POL-004');
  });

  it('GET /api/admin/metrics - returns system KPIs and metrics', async () => {
    const res = await request(app).get('/api/admin/metrics');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalTickets).toBeGreaterThanOrEqual(1);
    expect(typeof res.body.data.approvalRate).toBe('number');
  });

  it('GET /api/admin/tickets - returns recent tickets list', async () => {
    const res = await request(app).get('/api/admin/tickets');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/admin/tickets/:id/override - allows supervisor manual override with note', async () => {
    const ticketsRes = await request(app).get('/api/admin/tickets');
    const ticketId = ticketsRes.body.data[0].id;

    const res = await request(app)
      .post(`/api/admin/tickets/${ticketId}/override`)
      .send({
        decision: 'DENIED',
        notes: 'Supervisor override: customer provided conflicting damage photo upon inspection.'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.newDecision).toBe('DENIED');
  });
});
