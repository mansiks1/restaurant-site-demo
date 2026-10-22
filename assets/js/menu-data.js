const DISHES_URL = new URL('../../content/menu/dishes.json', import.meta.url);
const CATEGORIES_URL = new URL('../../content/menu/categories.json', import.meta.url);

async function readJson(address) {
  const response = await fetch(address);
  if (!response.ok) throw new Error(`Не удалось загрузить меню: ${response.status}`);
  return response.json();
}
export async function loadDishes() {
  const data = await readJson(DISHES_URL);
  if (!Array.isArray(data.dishes)) throw new Error('В dishes.json отсутствует список dishes');
  return data.dishes;
}
export async function loadMenu() {
  const [data, dishes] = await Promise.all([readJson(CATEGORIES_URL), loadDishes()]);
  if (!Array.isArray(data.categories)) throw new Error('Не найден список категорий');
  return { categories: data.categories, dishes };
}
