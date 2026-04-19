export function getSemanaActual(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function formatSemana(semana: string): string {
  const [year, weekStr] = semana.split("-W");
  const weekNum = parseInt(weekStr);

  const jan4 = new Date(Date.UTC(parseInt(year), 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(
    jan4.getUTCDate() - (jan4.getUTCDay() || 7) + 1 + (weekNum - 1) * 7
  );
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const d1 = monday.getUTCDate();
  const m1 = MESES[monday.getUTCMonth()];
  const d2 = sunday.getUTCDate();
  const m2 = MESES[sunday.getUTCMonth()];

  if (monday.getUTCMonth() === sunday.getUTCMonth()) {
    return `${d1} al ${d2} de ${m2} de ${year}`;
  }
  return `${d1} de ${m1} al ${d2} de ${m2} de ${year}`;
}
