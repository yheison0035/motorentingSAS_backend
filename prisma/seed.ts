import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const stateCustomer = [
  'Sin Contactar',
  'INTENTANDO CONTACTAR',
  'REPORTADO',
  'INTERESADO',
  'CREDIORBE',
  'PROGRESER',
  'SUFI',
  'VANTI',
  'MOTORENTING',
  'MOTORENTING PLUS',
  'BBVA',
  'CAJA SOCIAL',
  'NU BANK',
  'ADDI',
  'BANCO BOGOTÁ',
  'VEHIGRUPO',
  'APROBADO OTROS',
  'VENTA',
];

async function main() {
  for (const name of stateCustomer) {
    await prisma.state.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
