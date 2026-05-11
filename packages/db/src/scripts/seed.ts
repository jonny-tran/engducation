import "dotenv/config";
import { db } from "../index";
import { user, account } from "../schema/auth";
import { hashPassword } from "@better-auth/utils/password";
import { eq } from "drizzle-orm";

async function seed() {
  const rawPassword = process.env.DEV_PASS;
  if (!rawPassword) {
    console.error("❌ Lỗi: Vui lòng đặt biến môi trường DEV_PASS trong file .env");
    process.exit(1);
  }

  console.log("🔐 Đang mã hóa mật khẩu...");
  const hashedPassword = await hashPassword(rawPassword);
  console.log(`📋 Raw password : ${rawPassword}`);
  console.log(`🔒 Hashed password: ${hashedPassword}`);

  const adminId = crypto.randomUUID();
  const user1Id = crypto.randomUUID();
  const user2Id = crypto.randomUUID();

  const seedUsers = [
    {
      id: adminId,
      name: "Admin",
      email: "engducationgroup@gmail.com",
      role: "admin",
    },
    {
      id: user1Id,
      name: "Jonny Tran",
      email: "jonnytran.working@gmail.com",
      role: "user",
    },
    {
      id: user2Id,
      name: "DatTT",
      email: "datttse172775@fpt.edu.vn",
      role: "user",
    },
  ];

  console.log("📦 Đang khởi tạo dữ liệu mẫu...");

  for (const seedUser of seedUsers) {
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, seedUser.email),
    });

    if (existingUser) {
      console.log(`⚠️  Tài khoản ${seedUser.email} đã tồn tại, cập nhật password...`);
      await db
        .update(account)
        .set({ password: hashedPassword, providerId: "credential" })
        .where(eq(account.userId, existingUser.id));
      console.log(`✅ Password đã được cập nhật cho: ${seedUser.email}`);
      continue;
    }

    await db.insert(user).values({
      id: seedUser.id,
      name: seedUser.name,
      email: seedUser.email,
      emailVerified: true,
      role: seedUser.role,
    });

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: seedUser.id,
      providerId: "credential",
      userId: seedUser.id,
      password: hashedPassword,
    });

    if (seedUser.role === "admin") {
      console.log("✅ Khởi tạo tài khoản Admin thành công!");
    } else {
      console.log(`✅ Khởi tạo tài khoản người dùng: ${seedUser.email} thành công!`);
    }
  }

  console.log("🎉 Hoàn tất khởi tạo dữ liệu mẫu.");
}

seed().catch((err) => {
  console.error("❌ Đã xảy ra lỗi trong quá trình seed:", err);
  process.exit(1);
});
