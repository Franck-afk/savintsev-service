export interface Stage {
  key: string;
  label: string;
}

export const serviceStages: Record<string, Stage[]> = {
  mounting: [
    { key: "accepted", label: "Принят" },
    { key: "removal", label: "Снятие колёс" },
    { key: "demount", label: "Демонтаж шин" },
    { key: "mount", label: "Монтаж шин" },
    { key: "balancing", label: "Балансировка" },
    { key: "installation", label: "Установка колёс" },
    { key: "completed", label: "Завершён" },
  ],
  storage: [
    { key: "accepted", label: "Принят" },
    { key: "receiving", label: "Приём шин" },
    { key: "cleaning", label: "Обработка" },
    { key: "placement", label: "Размещение" },
    { key: "completed", label: "Завершён" },
  ],
  repair: [
    { key: "accepted", label: "Принят" },
    { key: "inspection", label: "Осмотр" },
    { key: "repair", label: "Ремонт" },
    { key: "painting", label: "Покраска" },
    { key: "check", label: "Проверка" },
    { key: "completed", label: "Завершён" },
  ],
  balancing: [
    { key: "accepted", label: "Принят" },
    { key: "demount", label: "Демонтаж" },
    { key: "balancing", label: "Балансировка" },
    { key: "mount", label: "Монтаж" },
    { key: "completed", label: "Завершён" },
  ],
  puncture: [
    { key: "accepted", label: "Принят" },
    { key: "inspection", label: "Осмотр" },
    { key: "repair", label: "Ремонт" },
    { key: "check", label: "Проверка" },
    { key: "completed", label: "Завершён" },
  ],
  seasonal: [
    { key: "accepted", label: "Принят" },
    { key: "removal", label: "Снятие" },
    { key: "mount", label: "Монтаж" },
    { key: "balancing", label: "Балансировка" },
    { key: "completed", label: "Завершён" },
  ],
  other: [
    { key: "accepted", label: "Принят" },
    { key: "in_progress", label: "В работе" },
    { key: "completed", label: "Завершён" },
  ],
};

export const defaultStages: Stage[] = serviceStages.other;

export function getStages(serviceType?: string | null): Stage[] {
  return (serviceType && serviceStages[serviceType]) || defaultStages;
}

export function getStageLabel(serviceType: string | null | undefined, stageIndex: number): string {
  const stages = getStages(serviceType);
  return stages[stageIndex]?.label || `Этап ${stageIndex + 1}`;
}

export function isLastStage(serviceType: string | null | undefined, stageIndex: number): boolean {
  const stages = getStages(serviceType);
  return stageIndex >= stages.length - 1;
}

export function getStageIndex(serviceType: string | null | undefined, stageKey: string): number {
  const stages = getStages(serviceType);
  return stages.findIndex((s) => s.key === stageKey);
}
