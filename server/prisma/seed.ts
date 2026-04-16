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
        displayName: "Robert Allen"
        
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
    update: { profilePicture: "/womanwaiter1.png" },
    create: { name: 'Anna Karlsson', email: "AnnaKarlsson@gmail.com", profilePicture: "/womanwaiter1.png" }
  });

  const employeeEllen = await prisma.employee.upsert({
    where: { email: "employee1@sundsgarden.se" },
    update: { position: "Waiter", profilePicture: "/womanwaiter2.png" },
    create: { name: 'Ellen Johansson', email: "employee1@sundsgarden.se", position: "Waiter", profilePicture: "/womanwaiter2.png" }
  });

  const employeeOskar = await prisma.employee.upsert({
    where: { email: "oskar.nilsson@sundsgarden.se" },
    update: { position: "Waiter", profilePicture: "/menwaiter.png" },
    create: { name: 'Oskar Nilsson', email: "oskar.nilsson@sundsgarden.se", position: "Waiter", profilePicture: "/menwaiter.png" }
  });

  const employeeJohn = await prisma.employee.upsert({
    where: { email: "john.jones@sundsgarden.se" },
    update: { position: "Waiter", profilePicture: "/menwaiter1.png" },
    create: { name: 'John Jones', email: "john.jones@sundsgarden.se", position: "Waiter", profilePicture: "/menwaiter1.png" }
  });

  const employeeMaria = await prisma.employee.upsert({
    where: { email: "maria.ramos@sundsgarden.se" },
    update: { position: "Runner", profilePicture: "/womanwaiter3.png" },
    create: { name: 'Maria Ramos', email: "maria.ramos@sundsgarden.se", position: "Runner", profilePicture: "/womanwaiter3.png" }
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
