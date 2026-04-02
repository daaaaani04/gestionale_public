const DEFAULT_MENU = [
  { id: 1,  category: 'Antipasti', name: 'Bruschetta al pomodoro',     price: 5.00 },
  { id: 2,  category: 'Antipasti', name: 'Tagliere di salumi',          price: 12.00 },
  { id: 3,  category: 'Antipasti', name: 'Burrata con pomodori',        price: 8.00 },
  { id: 4,  category: 'Primi',     name: 'Spaghetti alla carbonara',    price: 12.00 },
  { id: 5,  category: 'Primi',     name: "Penne all'arrabbiata",        price: 10.00 },
  { id: 6,  category: 'Primi',     name: 'Risotto ai funghi',           price: 13.00 },
  { id: 7,  category: 'Secondi',   name: 'Pollo alla griglia',          price: 14.00 },
  { id: 8,  category: 'Secondi',   name: 'Tagliata di manzo',           price: 18.00 },
  { id: 9,  category: 'Secondi',   name: 'Branzino al forno',           price: 16.00 },
  { id: 10, category: 'Contorni',  name: 'Patate al forno',             price: 4.00 },
  { id: 11, category: 'Contorni',  name: 'Insalata mista',              price: 4.00 },
  { id: 12, category: 'Dolci',     name: 'Tiramisù',                    price: 6.00 },
  { id: 13, category: 'Dolci',     name: 'Panna cotta',                 price: 5.50 },
  { id: 14, category: 'Bevande',   name: 'Acqua naturale',              price: 2.00 },
  { id: 15, category: 'Bevande',   name: 'Acqua frizzante',             price: 2.00 },
  { id: 16, category: 'Bevande',   name: 'Vino rosso (calice)',         price: 5.00 },
  { id: 17, category: 'Bevande',   name: 'Vino bianco (calice)',        price: 5.00 },
];

export function loadMenu() {
  try {
    const saved = localStorage.getItem('menu');
    return saved ? JSON.parse(saved) : DEFAULT_MENU;
  } catch {
    return DEFAULT_MENU;
  }
}

export function saveMenu(menu) {
  localStorage.setItem('menu', JSON.stringify(menu));
}

export function getCategories(menu) {
  return [...new Set(menu.map(item => item.category))];
}

export function fmt(price) {
  return `€ ${Number(price).toFixed(2)}`;
}

export function orderTotal(items) {
  return items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
}
