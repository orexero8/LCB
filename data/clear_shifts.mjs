import pg from 'pg';
const c = new pg.Client({ host: '127.0.0.1', port: 51214 });
await c.connect();
await c.query("DELETE FROM shift_reports WHERE status = 'ACTIVE'");
console.log('Cleared active shifts');
await c.end();
