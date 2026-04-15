const {PrismaClient} = require ("@prisma/client");
const bcrypt = require ("bcrypt");

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function seed() {
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
  
  // Seed employees
  const employeeAnna = await prisma.employee.upsert({
    where: { email: "AnnaKarlsson@gmail.com" },
    update: {},
    create: { name: 'Anna Karlsson', email: "AnnaKarlsson@gmail.com" }
  });

  // Seed shifts
  const morningShift = await prisma.shift.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Morning', start_time: "7:00", end_time: "16:00" }
  });
  await prisma.shift.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'Afternoon', start_time: "15:00", end_time: "22:00" }
  });
  await prisma.shift.upsert({
    where: { id: 3 },
    update: {},
    create: { name: 'Night', start_time: "21:30", end_time: "7:15" }
  });

  // Seed shift instance
  const morningShiftInstance = await prisma.shiftInstances.upsert({
    where: { id: 1 },
    update: {},
    create: { shift_id: morningShift.id, date: new Date('2026-05-01') }
  });

  // Seed employee shift
  await prisma.employeeShift.upsert({
    where: { id: 1 },
    update: {},
    create: { employeeId: employeeAnna.id, shiftInstanceId: morningShiftInstance.id }
  });

  console.log("Seed data upserted successfully.");
}

seed()
  .catch((error) => {
    console.error("Failed to seed database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
});
