import { RedisPresence } from "@colyseus/redis-presence";

// Redis fica "preparado" para escala/matchmaking futuro: se REDIS_URL estiver
// configurada (docker-compose local ou managed Redis em produção), o Colyseus
// usa presence real via Redis; caso contrário cai no presence em memória
// (padrão do Colyseus quando nenhum presence e passado ao Server).
export function createPresence(): RedisPresence | undefined {
  const url = process.env.REDIS_URL;
  if (!url) return undefined;

  return new RedisPresence(url);
}
