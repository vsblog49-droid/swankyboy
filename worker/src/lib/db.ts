export async function first(stmt: D1PreparedStatement, ...params: any[]) {
  const res = await stmt.bind(...params).first();
  return res;
}

export async function all(stmt: D1PreparedStatement, ...params: any[]) {
  const res = await stmt.bind(...params).all();
  return res.results;
}

export function nowISO() {
  return new Date().toISOString();
}
