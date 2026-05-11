import "dotenv/config";
import { db } from "../index";

async function reset() {
  console.log("🔄 Đang xóa toàn bộ dữ liệu trong database...");

  await db.execute(`DROP SCHEMA public CASCADE`);
  await db.execute(`CREATE SCHEMA public`);

  console.log("✅ Đã xóa toàn bộ dữ liệu và reset database thành công.");
}

reset().catch((err) => {
  console.error("❌ Đã xảy ra lỗi trong quá trình reset:", err);
  process.exit(1);
});
