-- AlterTable
ALTER TABLE "Category" ADD COLUMN "tagline" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Category" ADD COLUMN "imageUrl" TEXT NOT NULL DEFAULT '';

-- Seed taglines and banner images for default categories
UPDATE "Category" SET "tagline" = 'Crispy beginnings', "imageUrl" = 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=1200&q=80' WHERE "name" = 'Starters';
UPDATE "Category" SET "tagline" = 'The main event', "imageUrl" = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80' WHERE "name" = 'Main Course';
UPDATE "Category" SET "tagline" = 'Ice-cold sips', "imageUrl" = 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80' WHERE "name" = 'Beverages';
UPDATE "Category" SET "tagline" = 'Sweet finish', "imageUrl" = 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=80' WHERE "name" = 'Desserts';
