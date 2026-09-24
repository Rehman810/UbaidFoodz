import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&h=800&q=85`;

/** Verified working Unsplash food photos */
const MENU_IMAGES: Record<string, string> = {
  "Crispy Chicken Pakora": img("photo-1606491956689-2ea866880c84"),
  "Dynamite Prawns": img("photo-1559847844-5315695dadae"),
  "Loaded Nachos": img("photo-1513456852971-30c0b8199d4d"),
  "Chicken Wings (6pc)": img("photo-1562967914-608f82629710"),
  "Mozzarella Sticks": img("photo-1513104890138-7c749659a591"),
  "Chicken Corn Soup": img("photo-1547592166-23ac45744acd"),
  "Ubaid Zinger Burger": img("photo-1568901346375-23c9450c58cd"),
  "Beef Smash Burger": img("photo-1550547660-d9450f859349"),
  "Club Sandwich": img("photo-1528735602780-2552fd46c7af"),
  "Grilled Chicken Burger": img("photo-1504674900247-0877df9cc836"),
  "Fish Fillet Burger": img("photo-1551782450-17144efb9c50"),
  "Chicken Tikka Pizza 12\"": img("photo-1565299624946-b28f40a0ae38"),
  "Pepperoni Pizza 12\"": img("photo-1513104890138-7c749659a591"),
  "Margherita Pizza 12\"": img("photo-1574071318508-1cdbab80d002"),
  "Pasta Alfredo": img("photo-1621996346565-e3dbc646d9a9"),
  "Arrabiata Penne": img("photo-1563379091339-03b21ab4a4f8"),
  "Karachi Chicken Biryani": img("photo-1589302168068-964664d93dc0"),
  "Beef Biryani": img("photo-1589302168068-964664d93dc0"),
  "Mutton Pulao": img("photo-1596797038530-2c107229654b"),
  "Egg Fried Rice": img("photo-1603133872878-684f208fb84b"),
  "BBQ Broast Quarter": img("photo-1626082927389-6cd097cdc6ec"),
  "BBQ Broast Half": img("photo-1626082927389-6cd097cdc6ec"),
  "Chicken Tikka Platter": img("photo-1603360946369-dc9bb6258143"),
  "Seekh Kebab Plate": img("photo-1529042410759-befb1204b468"),
  "Malai Boti": img("photo-1555939594-58d7cb561ad1"),
  "Chicken Karahi": img("photo-1603894584373-5ac82b2ae398"),
  "Mutton Karahi": img("photo-1555939594-58d7cb561ad1"),
  "Butter Chicken": img("photo-1603894584373-5ac82b2ae398"),
  "Daal Makhni": img("photo-1756821753095-64134f5c0c5c"),
  "Masala Fries": img("photo-1573080496219-bb080dd4f877"),
  "Garlic Bread": img("photo-1574071318508-1cdbab80d002"),
  "Coleslaw": img("photo-1565958011703-44f9829ba187"),
  "Raita": img("photo-1527661591475-527312dd65f5"),
  "Fresh Lime Soda": img("photo-1513558161293-cdaf765ed2fd"),
  "Mango Lassi": img("photo-1527661591475-527312dd65f5"),
  "Kashmiri Chai": img("photo-1571934811356-5cc061b6821f"),
  "Cold Coffee": img("photo-1461023058943-07fcbe16d735"),
  "Mint Margarita": img("photo-1546173159-315724a31696"),
  "Soft Drink": img("photo-1629203851122-3726ecdf080e"),
  "Gulab Jamun": img("photo-1666190092159-3171cf0fbb12"),
  "Molten Lava Cake": img("photo-1606313564200-e75d5e30476c"),
  "Kulfi Falooda": img("photo-1488477181946-6428a0291777"),
  "Brownie Sundae": img("photo-1563805042-7684c019e1cb"),
};

const CATEGORY_IMAGES: Record<string, string> = {
  "Karahi & Curries": img("photo-1603894584373-5ac82b2ae398"),
};

async function main() {
  let updated = 0;
  for (const [name, imageUrl] of Object.entries(MENU_IMAGES)) {
    const result = await prisma.menuItem.updateMany({ where: { name }, data: { imageUrl } });
    updated += result.count;
  }
  for (const [name, imageUrl] of Object.entries(CATEGORY_IMAGES)) {
    await prisma.category.updateMany({ where: { name }, data: { imageUrl } });
  }
  console.log(`Updated ${updated} menu item images.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
