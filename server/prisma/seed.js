const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  const users = [
    {
      email: "employer1@sundsgarden.se",
      password: "123456",
      role: "employer",
      displayName: "Restaurant Manager"
    },
    {
      email: "employee1@sundsgarden.se",
      password: "123456",
      role: "employee",
      displayName: "Ellen Johansson"
    }
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        password: hashedPassword,
        role: user.role,
        displayName: user.displayName
      },
      create: {
        ...user,
        password: hashedPassword
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed data upserted successfully.");
  })
  .catch(async (error) => {
    console.error("Failed to seed database:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
