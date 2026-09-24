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
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

const MENU = [
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
    imageUrl: img("photo-1565680018434-b513d5ea5df1"),
  },
  {
    name: "Loaded Nachos",
    description: "House nachos, cheddar, jalapeños, salsa and garlic mayo drizzle.",
    price: 650,
    category: "Starters",
    imageUrl: img("photo-1513456852971-30c0b8199d4d"),
  },
  {
    name: "Masala Fries",
    description: "Skin-on fries dusted with chaat masala, served with spicy ketchup.",
    price: 320,
    category: "Starters",
    imageUrl: img("photo-1573080496219-bb080dd4f877"),
  },
  {
    name: "Chicken Tikka Platter",
    description: "Charcoal-grilled tikka, onions, naan and raita — a Ubaid classic.",
    price: 1290,
    category: "Main Course",
    imageUrl: img("photo-1603360946369-dc9bb6258143"),
  },
  {
    name: "Ubaid Zinger Burger",
    description: "Crunchy spicy fillet, cheese, lettuce and secret sauce in a toasted bun.",
    price: 790,
    category: "Main Course",
    imageUrl: img("photo-1568901346375-23c9450c58cd"),
  },
  {
    name: "Beef Smash Burger",
    description: "Double smash patties, American cheese, pickles and caramelized onions.",
    price: 950,
    category: "Main Course",
    imageUrl: img("photo-1550547660-d9450f859349"),
  },
  {
    name: "Karachi Chicken Biryani",
    description: "Dum-cooked basmati, tender chicken, potatoes and Ubaid garam masala.",
    price: 690,
    category: "Main Course",
    imageUrl: img("photo-1589302168068-964664d93dc0"),
  },
  {
    name: "BBQ Broast Quarter",
    description: "Crispy broast with BBQ glaze, coleslaw and fries.",
    price: 850,
    category: "Main Course",
    imageUrl: img("photo-1626082927389-6cd097cdc6ec"),
  },
  {
    name: "Chicken Tikka Pizza 12\"",
    description: "Hand-stretched crust, tikka chunks, peppers and mozzarella.",
    price: 1490,
    category: "Main Course",
    imageUrl: img("photo-1565299624946-b28f40a0ae38"),
  },
  {
    name: "Club Sandwich",
    description: "Triple-decker with chicken, egg, cheese and fries on the side.",
    price: 720,
    category: "Main Course",
    imageUrl: img("photo-1528735602780-2552fd46c7af"),
  },
  {
    name: "Pasta Alfredo",
    description: "Creamy fettuccine, grilled chicken and parmesan.",
    price: 980,
    category: "Main Course",
    imageUrl: img("photo-1621996346565-e3dbc646d9a9"),
  },
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
    name: "Gulab Jamun",
    description: "Warm milk dumplings in rose syrup, two pieces.",
    price: 240,
    category: "Desserts",
    imageUrl: img("photo-1666190092159-3171d1c9f042"),
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
      imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=1200&q=80",
    },
    {
      name: "Main Course",
      tagline: "The main event",
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
    },
    {
      name: "Beverages",
      tagline: "Ice-cold sips",
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80",
    },
    {
      name: "Desserts",
      tagline: "Sweet finish",
      imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=80",
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

  const [customer, admin, rider, rider2] = await Promise.all([
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
  ]);

  void admin;

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
    await prisma.menuItemSize.createMany({
      data: [
        { menuItemId: zinger.id, name: "Regular", price: 790, sortOrder: 1 },
        { menuItemId: zinger.id, name: "Meal (fries + drink)", price: 1090, sortOrder: 2 },
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
    await prisma.menuItemSize.createMany({
      data: [
        { menuItemId: pizza.id, name: '10"', price: 1190, sortOrder: 1 },
        { menuItemId: pizza.id, name: '12"', price: 1490, sortOrder: 2 },
        { menuItemId: pizza.id, name: '14"', price: 1790, sortOrder: 3 },
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

  const pick = (...idxs: number[]) =>
    idxs.map((i) => items[i]).filter(Boolean);

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
      bag: pick(5, 3, 12),
      qty: [1, 1, 2],
    },
    {
      number: "UF-1041",
      status: OrderStatus.PREPARING,
      createdAt: daysAgo(0, 13),
      address: "Apt 4B, Al-Tijarah, Shahrah-e-Faisal, Karachi",
      bag: pick(7, 13),
      qty: [2, 2],
    },
    {
      number: "UF-1040",
      status: OrderStatus.OUT_FOR_DELIVERY,
      riderId: rider.id,
      createdAt: daysAgo(0, 12),
      address: "Shop 9, Boat Basin, Clifton Block 5, Karachi",
      notes: "Call on arrival, gate code 4411.",
      bag: pick(4, 14, 16),
      qty: [1, 1, 2],
    },
    {
      number: "UF-1039",
      status: OrderStatus.DELIVERED,
      riderId: rider.id,
      createdAt: daysAgo(0, 11),
      address: "C-19, North Nazimabad Block H, Karachi",
      bag: pick(9, 15),
      qty: [1, 2],
    },
    {
      number: "UF-1035",
      status: OrderStatus.DELIVERED,
      riderId: rider2.id,
      createdAt: daysAgo(1, 20),
      address: "Villa 8, Bahria Town Precinct 11, Karachi",
      bag: pick(6, 3, 18),
      qty: [2, 1, 1],
    },
    {
      number: "UF-1031",
      status: OrderStatus.DELIVERED,
      riderId: rider.id,
      createdAt: daysAgo(2, 19),
      address: "House 44, PECHS Block 2, Karachi",
      bag: pick(10, 12),
      qty: [1, 1],
    },
    {
      number: "UF-1028",
      status: OrderStatus.DELIVERED,
      riderId: rider.id,
      createdAt: daysAgo(3, 18),
      address: "Office 12, I.I. Chundrigar Road, Karachi",
      bag: pick(11, 15, 17),
      qty: [2, 2, 1],
    },
    {
      number: "UF-1022",
      status: OrderStatus.DELIVERED,
      riderId: rider2.id,
      createdAt: daysAgo(4, 21),
      address: "Flat 3, Gulshan-e-Iqbal Block 13-D, Karachi",
      bag: pick(7, 0, 13),
      qty: [3, 1, 3],
    },
    {
      number: "UF-1018",
      status: OrderStatus.CANCELLED,
      createdAt: daysAgo(5, 16),
      address: "House 2, Korangi Creek, Karachi",
      notes: "Customer cancelled — running late.",
      bag: pick(5),
      qty: [1],
    },
    {
      number: "UF-1014",
      status: OrderStatus.DELIVERED,
      riderId: rider.id,
      createdAt: daysAgo(6, 20),
      address: "Bungalow 21, Malir Cantonment, Karachi",
      bag: pick(4, 8, 16),
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
