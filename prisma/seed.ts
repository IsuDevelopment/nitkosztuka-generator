import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD env variable is required for seeding')
  }

  const existingAdmin = await prisma.user.findFirst({ where: { login: 'admin' } })
  if (existingAdmin) {
    console.log('Admin user already exists, skipping seed.')
    return
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.user.create({
    data: {
      login: 'admin',
      passwordHash,
      name: 'Administrator',
      isAdmin: true,
    },
  })

  console.log(`Created admin user: ${admin.login} (id: ${admin.id})`)

  const brand = await prisma.brand.create({
    data: {
      name: 'Nitkowa Sztuka',
      subtitle: 'rękodzieło tworzone z sercem',
      websiteUrl: 'https://example.com',
      defaultPaymentText: 'Płatność BLIK na numer telefonu: 669618009. Jeśli ktoś woli płatność na numer konta, podam numer konta w osobnej wiadomości.',
      defaultHandmadeText: 'Produkty są wykonywane ręcznie, dlatego każdy egzemplarz jest wyjątkowy. Kolory, układ sznurka i drobne detale mogą delikatnie różnić się od zdjęć lub wcześniejszych realizacji.',
      defaultLeadTime: '7–10 dni roboczych',
      createdById: admin.id,
    },
  })

  console.log(`Created default brand: ${brand.name}`)

  await prisma.deliveryMethod.createMany({
    data: [
      { brandId: brand.id, name: 'InPost Paczkomat', defaultCost: 12.99, createdById: admin.id },
      { brandId: brand.id, name: 'InPost Kurier', defaultCost: 14.99, createdById: admin.id },
      { brandId: brand.id, name: 'Odbiór osobisty', defaultCost: 0, createdById: admin.id },
    ],
  })

  console.log('Created default delivery methods')

  await prisma.taxRate.createMany({
    data: [
      { name: 'Ryczałt 8.5%', rate: 8.5, isDefault: false, createdById: admin.id },
      { name: 'Ryczałt 12%', rate: 12.0, isDefault: true, createdById: admin.id },
    ],
  })

  console.log('Created default tax rates')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
