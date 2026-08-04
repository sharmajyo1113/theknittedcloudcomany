'use strict';

require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
    const categories = [
        { name: 'Knitted Toys', slug: 'knitted-toys', description: 'Bears, bunnies and friends, hand cast one at a time.' },
        { name: 'Blankets & Throws', slug: 'blankets-throws', description: 'Cot to cuddle-size, knitted from natural fibres.' },
        { name: 'Nursery Sets', slug: 'nursery-sets', description: 'Mobiles, bassinet linen and soft nursery decor.' },
        { name: 'Gift Bundles', slug: 'gift-bundles', description: 'Ready-to-wrap sets for baby showers and birthdays.' },
    ];

    const categoryIds = {};
    for (const c of categories) {
        const created = await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
        categoryIds[c.name] = created.id;
    }

    const products = [
        {
            name: 'Wilfred the Bear', slug: 'wilfred-the-bear', categoryId: categoryIds['Knitted Toys'], sku: 'WB-001',
            description: 'Undyed merino, 28cm. Hand-knitted with embroidered features and every seam woven in so nothing comes loose.',
            price: 5644, stock: 14, icon: 'bear',
        },
        {
            name: 'Marlow the Sheep', slug: 'marlow-the-sheep', categoryId: categoryIds['Knitted Toys'], sku: 'WB-002',
            description: 'Bouclé wool, 24cm. A looped fleece texture knitted over a soft-stuffed body.',
            price: 5146, stock: 9, icon: 'sheep',
        },
        {
            name: 'Hazel the Bunny', slug: 'hazel-the-bunny', categoryId: categoryIds['Knitted Toys'], sku: 'WB-003',
            description: 'Organic cotton, 26cm, with long floppy ears and an embroidered face.',
            price: 4814, stock: 11, icon: 'bear',
        },
        {
            name: 'Overcast Cot Blanket', slug: 'overcast-cot-blanket', categoryId: categoryIds['Blankets & Throws'], sku: 'WB-010',
            description: 'Organic cotton, 90x120cm, knitted in a soft stockinette weave with a hand-tied fringe.',
            price: 7968, stock: 20, icon: 'blanket',
        },
        {
            name: 'Dawn Ridge Throw', slug: 'dawn-ridge-throw', categoryId: categoryIds['Blankets & Throws'], sku: 'WB-011',
            description: 'Chunky merino throw, 130x170cm, for the whole family to share.',
            price: 12284, stock: 7, icon: 'blanket',
        },
        {
            name: 'Cloud Cushion Trio', slug: 'cloud-cushion-trio', categoryId: categoryIds['Nursery Sets'], sku: 'WB-020',
            description: 'Set of 3 cloud-shaped cushions, cotton blend with piped edges.',
            price: 6972, stock: 16, icon: 'cushion',
        },
        {
            name: 'Drifting Clouds Mobile', slug: 'drifting-clouds-mobile', categoryId: categoryIds['Nursery Sets'], sku: 'WB-021',
            description: 'Hand-knitted cloud mobile for cot or bassinet, natural beechwood ring.',
            price: 5976, stock: 10, icon: 'cushion',
        },
        {
            name: 'New Arrival Gift Set', slug: 'new-arrival-gift-set', categoryId: categoryIds['Gift Bundles'], sku: 'WB-030',
            description: 'Wilfred the Bear and the Overcast Cot Blanket, boxed and ribboned, ready to gift.',
            price: 12450, stock: 8, icon: 'bear',
        },
    ];

    for (const p of products) {
        await prisma.product.upsert({ where: { slug: p.slug }, update: {}, create: p });
    }

    console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
