import { PrismaClient } from '../generated/prisma/client.ts';
import 'dotenv/config'
const prisma = new PrismaClient()

async function seed (){
  const employeeAnna = await prisma.employee.create({data:{name: 'Anna Karlsson', email: "AnnaKarlsson@gmail.com"}})
  //const employeeLillemor = await prisma.employee.create({data:{name: 'Lillemor Svensson', email: "LillemorSvensson@gmail.com"}})

  const morningShift = await prisma.shift.create({data:{name: 'Morning', start_time: "7:00", end_time: "16:00" }})
  const afternoonShift = await prisma.shift.create({data:{name: 'Afternoon', start_time: "15:00", end_time: "22:00" }})
  const nightShift = await prisma.shift.create({data:{name: 'Night', start_time: "21:30", end_time: "7:15" }})

  const morningShiftInstance = await prisma.shiftInstances.create({
    data: {
      shift_id: morningShift.id,
      date: new Date('2026-05-01')}
  })
  
  const employeeShift1 = await prisma.employeeShift.create({
    data: {
      employeeId: employeeAnna.id,
      shiftInstanceId: morningShiftInstance.id,
    } 
  })
}

seed().then( () => prisma.$disconnect())