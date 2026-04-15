export const STORAGE_KEYS = {
  expedientes: "archivo.expedientes",
  paquetes: "archivo.paquetes",
  movimientos: "archivo.movimientos",
  sesion: "archivo.sesion"
};

export function readJson(key, fallbackValue) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return fallbackValue;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallbackValue;
  }
}

export function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function ensureCollection(key, seedData) {
  const data = readJson(key, null);
  if (!data || !Array.isArray(data)) {
    writeJson(key, seedData);
    return seedData;
  }
  return data;
}

export function uid(prefix) {
  const stamp = Date.now().toString(36);
  const random = Math.floor(Math.random() * 10000).toString(36).padStart(3, "0");
  return `${prefix}-${stamp}-${random}`.toUpperCase();
}
