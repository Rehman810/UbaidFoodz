import "dotenv/config";
import { PrismaClient, OrderStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { generateInvoicePdf } from "../src/lib/invoice";
import {
  DEFAULT_DELIVERING_AREAS,
  KARACHI_AREAS,
  defaultChargeForArea,
} from "../src/lib/karachi-areas";

const prisma = new PrismaClient();

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&h=800&q=85`;

const MENU = [
  // Starters
  {
    name: "Crispy Chicken Pakora",
    description: "Golden fried chicken bites with mint chutney and a squeeze of lemon.",
    price: 490,
    category: "Starters",
    imageUrl: img("photo-1606491956689-2ea866880c84"),
  },
  {
    name: "Dynamite Prawns",
    description: "Crispy prawns tossed in creamy dynamite sauce, sesame and spring onion.",
    price: 890,
    category: "Starters",
    imageUrl: img("photo-1559847844-5315695dadae"),
  },
  {
    name: "Loaded Nachos",
    description: "House nachos, cheddar, jalapeños, salsa and garlic mayo drizzle.",
    price: 650,
    category: "Starters",
    imageUrl: img("photo-1513456852971-30c0b8199d4d"),
  },
  {
    name: "Chicken Wings (6pc)",
    description: "Spicy buffalo wings with ranch dip and celery sticks.",
    price: 750,
    category: "Starters",
    imageUrl: img("photo-1562967914-608f82629710"),
  },
  {
    name: "Mozzarella Sticks",
    description: "Golden fried cheese sticks with marinara sauce.",
    price: 580,
    category: "Starters",
    imageUrl: img("photo-1513104890138-7c749659a591"),
  },
  {
    name: "Chicken Corn Soup",
    description: "Creamy Pakistani-style soup with shredded chicken and sweet corn.",
    price: 420,
    category: "Starters",
    imageUrl: img("photo-1547592166-23ac45744acd"),
  },
  // Burgers & Sandwiches
  {
    name: "Ubaid Zinger Burger",
    description: "Crunchy spicy fillet, cheese, lettuce and secret sauce in a toasted bun.",
    price: 790,
    category: "Burgers & Sandwiches",
    imageUrl: img("photo-1568901346375-23c9450c58cd"),
  },
  {
    name: "Beef Smash Burger",
    description: "Double smash patties, American cheese, pickles and caramelized onions.",
    price: 950,
    category: "Burgers & Sandwiches",
    imageUrl: img("photo-1550547660-d9450f859349"),
  },
  {
    name: "Club Sandwich",
    description: "Triple-decker with chicken, egg, cheese and fries on the side.",
    price: 720,
    category: "Burgers & Sandwiches",
    imageUrl: img("photo-1528735602780-2552fd46c7af"),
  },
  {
    name: "Grilled Chicken Burger",
    description: "Char-grilled breast, cheddar, tomato and garlic mayo.",
    price: 690,
    category: "Burgers & Sandwiches",
    imageUrl: img("photo-1504674900247-0877df9cc836"),
  },
  {
    name: "Fish Fillet Burger",
    description: "Crispy fish fillet, tartar sauce and lettuce on a brioche bun.",
    price: 820,
    category: "Burgers & Sandwiches",
    imageUrl: img("photo-1551782450-17144efb9c50"),
  },
  // Pizza & Pasta
  {
    name: "Chicken Tikka Pizza 12\"",
    description: "Hand-stretched crust, tikka chunks, peppers and mozzarella.",
    price: 1490,
    category: "Pizza & Pasta",
    imageUrl: img("photo-1565299624946-b28f40a0ae38"),
  },
  {
    name: "Pepperoni Pizza 12\"",
    description: "Classic pepperoni, mozzarella and house tomato sauce.",
    price: 1390,
    category: "Pizza & Pasta",
    imageUrl: img("photo-1513104890138-7c749659a591"),
  },
  {
    name: "Margherita Pizza 12\"",
    description: "Fresh basil, mozzarella and San Marzano-style tomato base.",
    price: 1190,
    category: "Pizza & Pasta",
    imageUrl: img("photo-1574071318508-1cdbab80d002"),
  },
  {
    name: "Pasta Alfredo",
    description: "Creamy fettuccine, grilled chicken and parmesan.",
    price: 980,
    category: "Pizza & Pasta",
    imageUrl: img("photo-1621996346565-e3dbc646d9a9"),
  },
  {
    name: "Arrabiata Penne",
    description: "Spicy tomato penne with olives, garlic and fresh herbs.",
    price: 850,
    category: "Pizza & Pasta",
    imageUrl: img("photo-1563379091339-03b21ab4a4f8"),
  },
  // Biryani & Rice
  {
    name: "Karachi Chicken Biryani",
    description: "Dum-cooked basmati, tender chicken, potatoes and Ubaid garam masala.",
    price: 690,
    category: "Biryani & Rice",
    imageUrl: img("photo-1589302168068-964664d93dc0"),
  },
  {
    name: "Beef Biryani",
    description: "Slow-cooked beef on fragrant basmati with fried onions and raita.",
    price: 890,
    category: "Biryani & Rice",
    imageUrl: img("photo-1589302168068-964664d93dc0"),
  },
  {
    name: "Mutton Pulao",
    description: "Aromatic pulao with tender mutton pieces and whole spices.",
    price: 950,
    category: "Biryani & Rice",
    imageUrl: img("photo-1596797038530-2c107229654b"),
  },
  {
    name: "Egg Fried Rice",
    description: "Wok-tossed rice with egg, spring onion and soy glaze.",
    price: 520,
    category: "Biryani & Rice",
    imageUrl: img("photo-1603133872878-684f208fb84b"),
  },
  // BBQ & Broast
  {
    name: "BBQ Broast Quarter",
    description: "Crispy broast with BBQ glaze, coleslaw and fries.",
    price: 850,
    category: "BBQ & Broast",
    imageUrl: img("photo-1626082927389-6cd097cdc6ec"),
  },
  {
    name: "BBQ Broast Half",
    description: "Half chicken broast platter with fries, coleslaw and garlic dip.",
    price: 1490,
    category: "BBQ & Broast",
    imageUrl: img("photo-1626082927389-6cd097cdc6ec"),
  },
  {
    name: "Chicken Tikka Platter",
    description: "Charcoal-grilled tikka, onions, naan and raita — a Ubaid classic.",
    price: 1290,
    category: "BBQ & Broast",
    imageUrl: img("photo-1603360946369-dc9bb6258143"),
  },
  {
    name: "Seekh Kebab Plate",
    description: "Four juicy seekh kebabs with naan, salad and chutney.",
    price: 980,
    category: "BBQ & Broast",
    imageUrl: img("photo-1529042410759-befb1204b468"),
  },
  {
    name: "Malai Boti",
    description: "Creamy marinated chicken boti grilled over charcoal.",
    price: 1100,
    category: "BBQ & Broast",
    imageUrl: img("photo-1555939594-58d7cb561ad1"),
  },
  // Karahi & Curries
  {
    name: "Chicken Karahi",
    description: "Sizzling wok karahi with tomatoes, ginger and green chilli.",
    price: 1450,
    category: "Karahi & Curries",
    imageUrl: img("photo-1603894584373-5ac82b2ae398"),
  },
  {
    name: "Mutton Karahi",
    description: "Tender mutton in rich tomato masala — family favourite.",
    price: 1890,
    category: "Karahi & Curries",
    imageUrl: img("photo-1555939594-58d7cb561ad1"),
  },
  {
    name: "Butter Chicken",
    description: "Creamy tomato gravy with tandoori chicken and butter naan.",
    price: 1350,
    category: "Karahi & Curries",
    imageUrl: img("photo-1603894584373-5ac82b2ae398"),
  },
  {
    name: "Daal Makhni",
    description: "Slow-cooked black lentils finished with cream and butter.",
    price: 650,
    category: "Karahi & Curries",
    imageUrl: img("photo-1756821753095-64134f5c0c5c"),
  },
  // Sides
  {
    name: "Masala Fries",
    description: "Skin-on fries dusted with chaat masala, served with spicy ketchup.",
    price: 320,
    category: "Sides",
    imageUrl: img("photo-1573080496219-bb080dd4f877"),
  },
  {
    name: "Garlic Bread",
    description: "Toasted baguette with garlic butter and herbs.",
    price: 380,
    category: "Sides",
    imageUrl: img("photo-1574071318508-1cdbab80d002"),
  },
  {
    name: "Coleslaw",
    description: "Creamy cabbage slaw — perfect with broast and burgers.",
    price: 220,
    category: "Sides",
    imageUrl: img("photo-1565958011703-44f9829ba187"),
  },
  {
    name: "Raita",
    description: "Cool cucumber and mint yogurt — pairs with biryani and karahi.",
    price: 150,
    category: "Sides",
    imageUrl: img("photo-1527661591475-527312dd65f5"),
  },
  // Beverages
  {
    name: "Fresh Lime Soda",
    description: "Sweet, salt or mixed — ice-cold and sharply citrus.",
    price: 180,
    category: "Beverages",
    imageUrl: img("photo-1513558161293-cdaf765ed2fd"),
  },
  {
    name: "Mango Lassi",
    description: "Thick Alphonso mango yogurt shake, chilled.",
    price: 280,
    category: "Beverages",
    imageUrl: img("photo-1527661591475-527312dd65f5"),
  },
  {
    name: "Kashmiri Chai",
    description: "Pink tea with crushed pistachios — evening special.",
    price: 220,
    category: "Beverages",
    imageUrl: img("photo-1571934811356-5cc061b6821f"),
  },
  {
    name: "Cold Coffee",
    description: "Blended espresso, milk and ice cream swirl.",
    price: 350,
    category: "Beverages",
    imageUrl: img("photo-1461023058943-07fcbe16d735"),
  },
  {
    name: "Mint Margarita",
    description: "Frozen mint lime cooler — sweet and tangy.",
    price: 320,
    category: "Beverages",
    imageUrl: img("photo-1546173159-315724a31696"),
  },
  {
    name: "Soft Drink",
    description: "Pepsi, 7Up or Mirinda — chilled 345ml can.",
    price: 120,
    category: "Beverages",
    imageUrl: img("photo-1629203851122-3726ecdf080e"),
  },
  // Desserts
  {
    name: "Gulab Jamun",
    description: "Warm milk dumplings in rose syrup, two pieces.",
    price: 240,
    category: "Desserts",
    imageUrl: img("photo-1666190092159-3171cf0fbb12"),
  },
  {
    name: "Molten Lava Cake",
    description: "Dark chocolate cake with a flowing centre, vanilla scoop.",
    price: 420,
    category: "Desserts",
    imageUrl: img("photo-1606313564200-e75d5e30476c"),
  },
  {
    name: "Kulfi Falooda",
    description: "Saffron kulfi, vermicelli, rose syrup and basil seeds.",
    price: 390,
    category: "Desserts",
    imageUrl: img("photo-1488477181946-6428a0291777"),
  },
  {
    name: "Brownie Sundae",
    description: "Warm brownie, vanilla ice cream and chocolate sauce.",
    price: 480,
    category: "Desserts",
    imageUrl: img("photo-1563805042-7684c019e1cb"),
  },
];

async function seedDeliveryAreas() {
  const count = await prisma.deliveryArea.count();
  if (count > 0) return;
  for (let i = 0; i < KARACHI_AREAS.length; i++) {
    const name = KARACHI_AREAS[i];
    await prisma.deliveryArea.create({
      data: {
        name,
        deliveryCharge: defaultChargeForArea(name),
        isDelivering: DEFAULT_DELIVERING_AREAS.has(name),
        sortOrder: i + 1,
      },
    });
  }
  console.log(`Seeded ${KARACHI_AREAS.length} Karachi delivery areas.`);
}

async function main() {
  await seedDeliveryAreas();

  const already = await prisma.user.findUnique({
    where: { email: "admin@ubaidfastfoodz.com" },
  });
  if (already && process.env.FORCE_SEED !== "1") {
    console.log("Demo data already present. Set FORCE_SEED=1 to reset.");
    return;
  }

  const hash = await bcrypt.hash("demo123", 10);

  await prisma.invoice.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.promoBanner.deleteMany();
  await prisma.deliveryArea.deleteMany();
  await prisma.dealItem.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const categorySeed = [
    {
      name: "Starters",
      tagline: "Crispy beginnings",
      imageUrl: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=1200&h=600&q=85",
    },
    {
      name: "Burgers & Sandwiches",
      tagline: "Stacked & loaded",
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&h=600&q=85",
    },
    {
      name: "Pizza & Pasta",
      tagline: "Oven-fresh classics",
      imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&h=600&q=85",
    },
    {
      name: "Biryani & Rice",
      tagline: "Dum-cooked comfort",
      imageUrl: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1200&h=600&q=85",
    },
    {
      name: "BBQ & Broast",
      tagline: "Charcoal & crunch",
      imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=1200&h=600&q=85",
    },
    {
      name: "Karahi & Curries",
      tagline: "Sizzling handis",
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=1200&h=600&q=85",
    },
    {
      name: "Sides",
      tagline: "Perfect add-ons",
      imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=1200&h=600&q=85",
    },
    {
      name: "Beverages",
      tagline: "Ice-cold sips",
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&h=600&q=85",
    },
    {
      name: "Desserts",
      tagline: "Sweet finish",
      imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&h=600&q=85",
    },
  ];
  for (let i = 0; i < categorySeed.length; i++) {
    await prisma.category.create({ data: { ...categorySeed[i], sortOrder: i + 1 } });
  }

  for (let i = 0; i < KARACHI_AREAS.length; i++) {
    const name = KARACHI_AREAS[i];
    await prisma.deliveryArea.create({
      data: {
        name,
        deliveryCharge: defaultChargeForArea(name),
        isDelivering: DEFAULT_DELIVERING_AREAS.has(name),
        sortOrder: i + 1,
      },
    });
  }

  const [customer, admin, rider, rider2, chef] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Ayesha Khan",
        email: "customer@ubaidfastfoodz.com",
        passwordHash: hash,
        role: Role.CUSTOMER,
        phone: "0300-1112233",
      },
    }),
    prisma.user.create({
      data: {
        name: "Ubaid Admin",
        email: "admin@ubaidfastfoodz.com",
        passwordHash: hash,
        role: Role.ADMIN,
        phone: "0321-5556677",
      },
    }),
    prisma.user.create({
      data: {
        name: "Hassan Rider",
        email: "rider@ubaidfastfoodz.com",
        passwordHash: hash,
        role: Role.RIDER,
        phone: "0333-9988776",
      },
    }),
    prisma.user.create({
      data: {
        name: "Bilal Bike",
        email: "rider2@ubaidfastfoodz.com",
        passwordHash: hash,
        role: Role.RIDER,
        phone: "0345-2211009",
      },
    }),
    prisma.user.create({
      data: {
        name: "Chef Ali",
        email: "chef@ubaidfastfoodz.com",
        passwordHash: hash,
        role: Role.CHEF,
        phone: "0322-4455667",
      },
    }),
  ]);

  void admin;
  void chef;

  const items: { id: string; name: string; imageUrl: string; price: number }[] = [];
  for (const m of MENU) {
    const row = await prisma.menuItem.create({ data: m });
    items.push({ ...row, price: Number(row.price) });
  }

  const zinger = items.find((i) => i.name.includes("Zinger"));
  if (zinger) {
    await prisma.menuItem.update({
      where: { id: zinger.id },
      data: { discountPrice: 690 },
    });
    const zingerGroup = await prisma.menuItemOptionGroup.create({
      data: { menuItemId: zinger.id, name: "Choose an option", required: true, sortOrder: 1 },
    });
    await prisma.menuItemOption.createMany({
      data: [
        { groupId: zingerGroup.id, name: "Regular", price: 790, discountPrice: 690, sortOrder: 1 },
        { groupId: zingerGroup.id, name: "Meal (fries + drink)", price: 1090, discountPrice: 990, sortOrder: 2 },
      ],
    });
    await prisma.menuItemAddon.createMany({
      data: [
        { menuItemId: zinger.id, name: "Extra cheese", price: 120, sortOrder: 1 },
        { menuItemId: zinger.id, name: "Extra patty", price: 250, sortOrder: 2 },
      ],
    });
  }

  const pizza = items.find((i) => i.name.includes("Pizza"));
  if (pizza) {
    const pizzaGroup = await prisma.menuItemOptionGroup.create({
      data: { menuItemId: pizza.id, name: "Choose size", required: true, sortOrder: 1 },
    });
    await prisma.menuItemOption.createMany({
      data: [
        { groupId: pizzaGroup.id, name: '10"', price: 1190, sortOrder: 1 },
        { groupId: pizzaGroup.id, name: '12"', price: 1490, sortOrder: 2 },
        { groupId: pizzaGroup.id, name: '14"', price: 1790, sortOrder: 3 },
      ],
    });
  }

  const fries = items.find((i) => i.name.includes("Fries"));
  if (fries) {
    const friesGroup = await prisma.menuItemOptionGroup.create({
      data: { menuItemId: fries.id, name: "Choose an option", required: true, sortOrder: 1 },
    });
    await prisma.menuItemOption.createMany({
      data: [
        { groupId: friesGroup.id, name: "Half", price: 380, discountPrice: 342, sortOrder: 1 },
        { groupId: friesGroup.id, name: "Full", price: 650, discountPrice: 580, sortOrder: 2 },
      ],
    });
  }

  await prisma.storeSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {
      freeDeliveryAbove: 2500,
      latitude: 24.8138,
      longitude: 67.03,
      minimumOrder: 500,
      instagramUrl: "https://instagram.com/ubaidfastfoodz",
      facebookUrl: "https://facebook.com/ubaidfastfoodz",
    },
  });

  await prisma.promoBanner.createMany({
    data: [
      {
        title: "Zinger special",
        imageUrl: "/carousel/carousel-zinger.png",
        linkUrl: "/menu",
        sortOrder: 1,
      },
      {
        title: "Biryani night",
        imageUrl: "/carousel/carousel-biryani.png",
        linkUrl: "/menu",
        sortOrder: 2,
      },
      {
        title: "BBQ broast",
        imageUrl: "/carousel/carousel-broast.png",
        linkUrl: "/menu",
        sortOrder: 3,
      },
    ],
  });

  const biryani = items.find((i) => i.name.includes("Biryani"));
  const lassi = items.find((i) => i.name.includes("Lassi"));
  if (biryani && lassi) {
    await prisma.deal.create({
      data: {
        title: "Biryani + Lassi Combo",
        description: "2 chicken biryanis and 2 mango lassis — perfect for sharing.",
        dealPrice: 2200,
        imageUrl: biryani.imageUrl,
        isActive: true,
        items: {
          create: [
            { menuItemId: biryani.id, quantity: 2 },
            { menuItemId: lassi.id, quantity: 2 },
          ],
        },
      },
    });
  }

  const pick = (...names: string[]) =>
    names
      .map((name) => items.find((i) => i.name.toLowerCase().includes(name.toLowerCase())))
      .filter(Boolean) as typeof items;

  const daysAgo = (n: number, hour = 13) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(hour, 10 + n, 0, 0);
    return d;
  };

  type SeedOrder = {
    number: string;
    status: OrderStatus;
    riderId?: string;
    createdAt: Date;
    address: string;
    notes?: string;
    bag: typeof items;
    qty: number[];
  };

  const seeds: SeedOrder[] = [
    {
      number: "UF-1042",
      status: OrderStatus.PENDING,
      createdAt: daysAgo(0, 14),
      address: "House 12, Street 7, DHA Phase 6, Karachi",
      notes: "Please add extra raita.",
      bag: pick("Zinger", "Fries", "Lime"),
      qty: [1, 1, 2],
    },
    {
      number: "UF-1041",
      status: OrderStatus.PREPARING,
      createdAt: daysAgo(0, 13),
      address: "Apt 4B, Al-Tijarah, Shahrah-e-Faisal, Karachi",
      bag: pick("Biryani", "Lassi"),
      qty: [2, 2],
    },
    {
      number: "UF-1040",
      status: OrderStatus.OUT_FOR_DELIVERY,
      riderId: rider.id,
      createdAt: daysAgo(0, 12),
      address: "Shop 9, Boat Basin, Clifton Block 5, Karachi",
      notes: "Call on arrival, gate code 4411.",
      bag: pick("Tikka", "Chai", "Gulab"),
      qty: [1, 1, 2],
    },
    {
      number: "UF-1039",
      status: OrderStatus.DELIVERED,
      riderId: rider.id,
      createdAt: daysAgo(0, 11),
      address: "C-19, North Nazimabad Block H, Karachi",
      bag: pick("Pizza", "Coffee"),
      qty: [1, 2],
    },
    {
      number: "UF-1035",
      status: OrderStatus.DELIVERED,
      riderId: rider2.id,
      createdAt: daysAgo(1, 20),
      address: "Villa 8, Bahria Town Precinct 11, Karachi",
      bag: pick("Smash", "Nachos", "Kulfi"),
      qty: [2, 1, 1],
    },
    {
      number: "UF-1031",
      status: OrderStatus.DELIVERED,
      riderId: rider.id,
      createdAt: daysAgo(2, 19),
      address: "House 44, PECHS Block 2, Karachi",
      bag: pick("Club", "Lime"),
      qty: [1, 1],
    },
    {
      number: "UF-1028",
      status: OrderStatus.DELIVERED,
      riderId: rider.id,
      createdAt: daysAgo(3, 18),
      address: "Office 12, I.I. Chundrigar Road, Karachi",
      bag: pick("Alfredo", "Lassi", "Lava"),
      qty: [2, 2, 1],
    },
    {
      number: "UF-1022",
      status: OrderStatus.DELIVERED,
      riderId: rider2.id,
      createdAt: daysAgo(4, 21),
      address: "Flat 3, Gulshan-e-Iqbal Block 13-D, Karachi",
      bag: pick("Biryani", "Pakora", "Lassi"),
      qty: [3, 1, 3],
    },
    {
      number: "UF-1018",
      status: OrderStatus.CANCELLED,
      createdAt: daysAgo(5, 16),
      address: "House 2, Korangi Creek, Karachi",
      notes: "Customer cancelled — running late.",
      bag: pick("Zinger"),
      qty: [1],
    },
    {
      number: "UF-1014",
      status: OrderStatus.DELIVERED,
      riderId: rider.id,
      createdAt: daysAgo(6, 20),
      address: "Bungalow 21, Malir Cantonment, Karachi",
      bag: pick("Tikka", "Broast", "Gulab"),
      qty: [1, 2, 2],
    },
  ];

  fs.mkdirSync(path.join(__dirname, "../invoices"), { recursive: true });

  for (const s of seeds) {
    const lines = s.bag.map((item, i) => ({
      menuItemId: item.id,
      quantity: s.qty[i] ?? 1,
      priceAtOrder: item.price,
      nameAtOrder: item.name,
    }));
    const total = lines.reduce(
      (sum, l) => sum + Number(l.priceAtOrder) * l.quantity,
      0
    );

    const order = await prisma.order.create({
      data: {
        orderNumber: s.number,
        customerId: customer.id,
        riderId: s.riderId,
        status: s.status,
        subtotal: total,
        deliveryCharge: 0,
        total,
        deliveryAddress: s.address,
        notes: s.notes,
        customerName: customer.name,
        customerPhone: customer.phone ?? "0300-1112233",
        createdAt: s.createdAt,
        items: { create: lines },
      },
      include: { items: true, invoice: true },
    });

    if (s.status === OrderStatus.DELIVERED) {
      await generateInvoicePdf(order.id);
    }
  }

  console.log("Seeded Ubaid Fast Foodz demo data.");
  console.log("  customer@ubaidfastfoodz.com / demo123");
  console.log("  admin@ubaidfastfoodz.com    / demo123");
  console.log("  rider@ubaidfastfoodz.com    / demo123");
  console.log("  chef@ubaidfastfoodz.com     / demo123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
