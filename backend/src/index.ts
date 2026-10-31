import { createServer } from "node:http";

import { createApp } from "./app.js";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { initRealtime } from "./lib/realtime.js";
import { expireStalePayments } from "./routes/payments.js";

const server = createServer(createApp());
initRealtime(server);

server.listen(config.port, () => {
  console.log(`🐻‍❄️ DUBIDU API jalan di http://localhost:${config.port} (${config.nodeEnv})`);
});

// setiap 5 menit: pembayaran yang lewat batas waktu → EXPIRED (slot psikolog dilepas lagi)
const expiryTimer = setInterval(() => {
  expireStalePayments().catch((err) => console.error("Gagal memproses pembayaran kedaluwarsa:", err));
}, 5 * 60 * 1000);

async function shutdown() {
  clearInterval(expiryTimer);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
