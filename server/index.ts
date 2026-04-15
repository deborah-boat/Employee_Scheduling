import express from 'express'
import 'dotenv/config' 
import { PrismaClient } from './generated/prisma/client.ts';
const prisma = new PrismaClient()
 
const app = express()
app.use(express.json())

app.get("/employee", async (req, res) => {
  try {
    const employees = await prisma.employee.findFirst()
    res.json(employees)
  } catch (error) {
    if(error instanceof Error){
      res.status(500).send(error.message)
    }
    res.status(500).send("Unknown error")
  }
})

app.get("/employees", async (req, res) => {
try {
const { name } = req.query;

const employees = await prisma.employee.findMany({
    where: {
    name: name ? {contains: String(name), mode: "insensitive"} : undefined
   
    },
    include: { 
      shifts: {
        include: {
          shiftInstance: {
            include : { shift: true }
          }
        }
      }
    }
  });

res.json(employees);

    } catch (error) 
  { res.status(500).send(error instanceof Error ? error.message : "Unknown error"); }
})

app.listen(5000, () => {
  console.log(`Server is running on port 5000`)
})