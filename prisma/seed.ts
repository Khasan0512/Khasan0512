import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createDealServiceSnapshots, normalizePhone } from "../src/lib/domain";

const prisma = new PrismaClient();

async function main() {
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.dealService.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.car.deleteMany();
  await prisma.client.deleteMany();
  await prisma.service.deleteMany();
  await prisma.box.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("123456", 10);

  const owner = await prisma.user.create({
    data: {
      name: "Артур (Владелец)",
      login: "artur",
      passwordHash,
      role: "OWNER",
    },
  });

  const manager1 = await prisma.user.create({
    data: {
      name: "Елена (Администратор)",
      login: "elena",
      passwordHash,
      role: "MANAGER",
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      name: "Максим (Администратор)",
      login: "maxim",
      passwordHash,
      role: "MANAGER",
    },
  });

  const master1 = await prisma.user.create({
    data: {
      name: "Денис (Полировка / Керамика)",
      login: "denis",
      passwordHash,
      role: "MASTER",
    },
  });

  const master2 = await prisma.user.create({
    data: {
      name: "Игорь (Плёнка PPF)",
      login: "igor",
      passwordHash,
      role: "MASTER",
    },
  });

  await prisma.user.createMany({
    data: [
      {
        name: "Руслан (Химчистка)",
        login: "ruslan",
        passwordHash,
        role: "MASTER",
      },
      {
        name: "Артём (Арматурщик / Подготовка)",
        login: "artem",
        passwordHash,
        role: "MASTER",
      },
    ],
  });

  const box1 = await prisma.box.create({
    data: { number: 1, name: "Бокс №1 — Полировка и керамика" },
  });
  const box2 = await prisma.box.create({
    data: { number: 2, name: "Бокс №2 — Оклейка плёнкой (чистая зона)" },
  });
  const box3 = await prisma.box.create({
    data: { number: 3, name: "Бокс №3 — Детейлинг-мойка и химчистка" },
  });

  const polish = await prisma.service.create({
    data: { name: "Восстановительная полировка кузова", basePrice: 18000, durationHours: 6 },
  });
  const ceramic = await prisma.service.create({
    data: { name: "Керамическое покрытие в 2 слоя", basePrice: 22000, durationHours: 4 },
  });
  const ppfFront = await prisma.service.create({
    data: { name: "Оклейка зон риска полиуретаном (PPF)", basePrice: 65000, durationHours: 8 },
  });
  const interior = await prisma.service.create({
    data: { name: "Полная химчистка салона с разбором", basePrice: 16000, durationHours: 6 },
  });
  await prisma.service.createMany({
    data: [
      { name: "Антидождь всех стёкол", basePrice: 4500, durationHours: 1 },
      { name: "Трёхфазная детейлинг-мойка", basePrice: 3500, durationHours: 2 },
    ],
  });

  // Клиент с двумя машинами в семье
  const client1 = await prisma.client.create({
    data: {
      name: "Дмитрий Соколов",
      phone: normalizePhone("+7 (999) 111-22-33"),
      source: "Telegram",
      notes: "Постоянный клиент, обслуживает свой X5 и Macan супруги",
    },
  });

  const carBmw = await prisma.car.create({
    data: {
      clientId: client1.id,
      brandModel: "BMW X5 G05",
      plateNumber: "А777АА777",
      color: "Чёрный сапфир",
    },
  });

  const carPorsche = await prisma.car.create({
    data: {
      clientId: client1.id,
      brandModel: "Porsche Macan",
      plateNumber: "М500ММ97",
      color: "Белый",
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: "Алексей Волков",
      phone: normalizePhone("8 (916) 444-55-66"),
      source: "Сайт",
    },
  });

  const carAudi = await prisma.car.create({
    data: {
      clientId: client2.id,
      brandModel: "Audi Q8",
      plateNumber: "Е808КХ799",
      color: "Серый Дайтона",
    },
  });

  const today = new Date();
  today.setMinutes(0, 0, 0);

  const slotStart1 = new Date(today);
  slotStart1.setHours(10, 0, 0, 0);
  const slotEnd1 = new Date(today);
  slotEnd1.setHours(18, 0, 0, 0);

  const snap1 = createDealServiceSnapshots([polish, ceramic]);
  const deal1 = await prisma.deal.create({
    data: {
      title: "BMW X5 — Полировка + Керамика",
      clientId: client1.id,
      carId: carBmw.id,
      managerId: manager1.id,
      masterId: master1.id,
      boxId: box1.id,
      stage: "IN_PROGRESS",
      startAt: slotStart1,
      endAt: slotEnd1,
      totalAmount: snap1.totalAmount,
      services: {
        create: snap1.items,
      },
      tasks: {
        create: {
          assigneeId: manager1.id,
          title: "Отправить клиенту фото промежуточного результата в ТГ",
          dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
      },
      logs: {
        create: [
          {
            userId: manager1.id,
            action: "CREATED",
            details: "Создана сделка из обращения в Telegram",
          },
          {
            userId: master1.id,
            action: "STAGE_CHANGED",
            details: "Машина принята в Бокс №1, начата полировка",
          },
        ],
      },
    },
  });

  const tomorrowStart = new Date(today);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(10, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(18, 0, 0, 0);

  const snap2 = createDealServiceSnapshots([ppfFront]);
  await prisma.deal.create({
    data: {
      title: "Audi Q8 — Бронирование зон риска PPF",
      clientId: client2.id,
      carId: carAudi.id,
      managerId: manager2.id,
      masterId: master2.id,
      boxId: box2.id,
      stage: "SCHEDULED",
      startAt: tomorrowStart,
      endAt: tomorrowEnd,
      totalAmount: snap2.totalAmount,
      services: {
        create: snap2.items,
      },
      tasks: {
        create: {
          assigneeId: manager2.id,
          title: "Напомнить клиенту за день о записи к 10:00",
          dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
        },
      },
      logs: {
        create: {
          userId: manager2.id,
          action: "SCHEDULED",
          details: "Записан в Бокс №2 к мастеру Игорю",
        },
      },
    },
  });

  const snap3 = createDealServiceSnapshots([interior]);
  await prisma.deal.create({
    data: {
      title: "Porsche Macan — Полная химчистка салона",
      clientId: client1.id,
      carId: carPorsche.id,
      managerId: manager1.id,
      stage: "ESTIMATE_SENT",
      totalAmount: snap3.totalAmount,
      services: {
        create: snap3.items,
      },
      tasks: {
        create: {
          assigneeId: manager1.id,
          title: "Уточнить удобный день для записи второй машины",
          dueAt: new Date(Date.now() - 60 * 60 * 1000), // специально просроченная задача для демонстрации!
        },
      },
      logs: {
        create: {
          userId: owner.id,
          action: "ESTIMATE_SENT",
          details: "Отправлен расчёт стоимости химчистки 16 000 ₽",
        },
      },
    },
  });

  console.log(`Seed complete: created deal "${deal1.title}" and studio data for БлескАвто (${box3.name}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
