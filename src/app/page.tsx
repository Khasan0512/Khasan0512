import { prisma } from "@/lib/prisma";
import { formatPhoneDisplay } from "@/lib/domain";
import { Car, CheckCircle2, Clock, ShieldCheck, Sparkles, Users, Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

const STAGE_LABELS: Record<string, string> = {
  NEW: "Новая заявка",
  ESTIMATE_SENT: "Расчёт отправлен",
  SCHEDULED: "Записан в бокс",
  IN_PROGRESS: "Машина в работе",
  READY: "Готово к выдаче",
  COMPLETED: "Выдано и оплачено",
  CANCELED: "Отказ",
};

export default async function HomePage() {
  const [users, clients, boxes, services, deals] = await Promise.all([
    prisma.user.findMany({ orderBy: { role: "asc" } }),
    prisma.client.findMany({
      where: { archivedAt: null },
      include: { cars: true },
    }),
    prisma.box.findMany({ orderBy: { number: "asc" } }),
    prisma.service.findMany({ where: { isActive: true } }),
    prisma.deal.findMany({
      where: { archivedAt: null },
      include: {
        client: true,
        car: true,
        box: true,
        master: true,
        services: true,
        tasks: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <header className="flex flex-col gap-3 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            Модуль 1 готов · Ядро базы данных Prisma
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            БлескАвто CRM
          </h1>
          <p className="text-sm text-slate-400">
            Детейлинг-студия на 3 бокса: клиенты с несколькими авто, заморозка цен в заказ-наряде и контроль накладок расписания.
          </p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            База данных подключена
          </div>
          <div className="mt-1 text-emerald-400/80">
            Сотрудников: {users.length} · Боксов: {boxes.length} · Услуг: {services.length}
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between text-slate-400 text-sm">
            <span>Активные сделки</span>
            <Wrench className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{deals.length}</p>
          <p className="mt-1 text-xs text-slate-500">Зафиксированы цены на момент заказа</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between text-slate-400 text-sm">
            <span>Клиенты в базе</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{clients.length}</p>
          <p className="mt-1 text-xs text-slate-500">Телефоны нормализованы без дублей</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between text-slate-400 text-sm">
            <span>Автомобили</span>
            <Car className="h-4 w-4 text-purple-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {clients.reduce((acc, c) => acc + c.cars.length, 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Поддержка нескольких авто у одного владельца</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between text-slate-400 text-sm">
            <span>Роли сотрудников</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">3 уровня</p>
          <p className="mt-1 text-xs text-slate-500">Владелец · Менеджер · Мастер</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-white">Текущие заказ-наряды в базе</h2>
          <div className="mt-4 space-y-3">
            {deals.map((deal) => (
              <div
                key={deal.id}
                className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-white">{deal.title}</span>
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                      {STAGE_LABELS[deal.stage] ?? deal.stage}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Клиент: {deal.client.name} ({formatPhoneDisplay(deal.client.phone)})
                    {deal.car ? ` · Авто: ${deal.car.brandModel} [${deal.car.plateNumber}]` : ""}
                  </div>
                  {deal.box && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-300/90">
                      <Clock className="h-3.5 w-3.5" />
                      {deal.box.name} · Мастер: {deal.master?.name ?? "Не назначен"}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-400">
                    {deal.totalAmount.toLocaleString("ru-RU")} ₽
                  </div>
                  <div className="text-xs text-slate-500">
                    Услуг: {deal.services.length} · Задач: {deal.tasks.length}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-white">Клиенты и их автопарк</h2>
          <div className="mt-4 space-y-4">
            {clients.map((client) => (
              <div key={client.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                <div className="font-medium text-white">{client.name}</div>
                <div className="text-xs text-slate-400">{formatPhoneDisplay(client.phone)} · {client.source}</div>
                <div className="mt-3 space-y-1.5">
                  {client.cars.map((car) => (
                    <div
                      key={car.id}
                      className="flex items-center justify-between rounded bg-slate-900 px-2.5 py-1.5 text-xs"
                    >
                      <span className="text-slate-200">{car.brandModel}</span>
                      <span className="font-mono text-slate-400">{car.plateNumber}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
