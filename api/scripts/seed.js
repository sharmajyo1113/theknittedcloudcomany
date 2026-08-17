'use strict';

require('dotenv/config');
const { getDb } = require('../src/lib/firestore');

function slugify(text) {
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function main() {
    const db = getDb();

    const categories = [
        { name: 'Knitted Toys', slug: 'knitted-toys', description: 'Bears, bunnies and friends, hand cast one at a time.' },
        { name: 'Blankets & Throws', slug: 'blankets-throws', description: 'Cot to cuddle-size, knitted from natural fibres.' },
        { name: 'Nursery Sets', slug: 'nursery-sets', description: 'Mobiles, bassinet linen and soft nursery decor.' },
        { name: 'Gift Bundles', slug: 'gift-bundles', description: 'Ready-to-wrap sets for baby showers and birthdays.' },
    ];

    for (const c of categories) {
        await db.collection('categories').doc(c.slug).set(c, { merge: true });
    }

    const products = [
        {
            name: 'Wilfred the Bear', slug: 'wilfred-the-bear', categoryId: 'knitted-toys', sku: 'WB-001',
            description: "A steady little face for a nursery shelf or a lifetime of hugs. Wilfred is hand-knitted from undyed merino, 28cm nose to toe, with every seam woven in by hand so nothing ever comes loose — and features embroidered, never printed, so his expression won't fade or peel.",
            price: 5644, stock: 14, icon: 'bear',
        },
        {
            name: 'Marlow the Sheep', slug: 'marlow-the-sheep', categoryId: 'knitted-toys', sku: 'WB-002',
            description: "Marlow's fleece is knitted in a bouclé wool that keeps its looped, tactile texture wash after wash — the closest thing to real curls we can put in small hands. 24cm, soft-stuffed body, made to be dragged everywhere and loved regardless.",
            price: 5146, stock: 9, icon: 'sheep',
        },
        {
            name: 'Hazel the Bunny', slug: 'hazel-the-bunny', categoryId: 'knitted-toys', sku: 'WB-003',
            description: "Long floppy ears and an embroidered face give Hazel her quiet, watchful charm. Knitted from organic cotton, 26cm, she's soft enough for newborn hands and sturdy enough to survive years of bedtime.",
            price: 4814, stock: 11, icon: 'bunny',
        },
        {
            name: 'Overcast Cot Blanket', slug: 'overcast-cot-blanket', categoryId: 'blankets-throws', sku: 'WB-010',
            description: 'A soft stockinette weave in organic cotton, finished with a hand-tied fringe — 90x120cm, sized for a cot but destined to follow a child well past it. Breathable enough for warm nights, cosy enough for cold ones.',
            price: 7968, stock: 20, icon: 'blanket',
        },
        {
            name: 'Dawn Ridge Throw', slug: 'dawn-ridge-throw', categoryId: 'blankets-throws', sku: 'WB-011',
            description: 'Chunky merino, knitted at a scale built for sharing — 130x170cm, big enough for the whole family under one blanket on a slow Sunday. Wool that only gets softer with time.',
            price: 12284, stock: 7, icon: 'blanket',
        },
        {
            name: 'Cloud Cushion Trio', slug: 'cloud-cushion-trio', categoryId: 'nursery-sets', sku: 'WB-020',
            description: 'Three cloud-shaped cushions in a soft cotton blend, each finished with a neat piped edge. Scatter them across a nursery chair or a reading nook — they hold their shape and their softness.',
            price: 6972, stock: 16, icon: 'cushion',
        },
        {
            name: 'Drifting Clouds Mobile', slug: 'drifting-clouds-mobile', categoryId: 'nursery-sets', sku: 'WB-021',
            description: "A hand-knitted cloud mobile suspended from a natural beechwood ring — gentle movement and soft shapes for a cot or bassinet, made to be one of the first things a baby learns to watch.",
            price: 5976, stock: 10, icon: 'mobile',
        },
        {
            name: 'New Arrival Gift Set', slug: 'new-arrival-gift-set', categoryId: 'gift-bundles', sku: 'WB-030',
            description: 'Wilfred the Bear and the Overcast Cot Blanket, boxed together and ribboned — a ready-to-give set for a baby shower or a new arrival, with nothing left for you to wrap.',
            price: 12450, stock: 8, icon: 'bear',
        },
    ];

    for (const p of products) {
        await db.collection('products').doc(p.slug).set(
            { ...p, isActive: true, imagePath: null, createdAt: new Date().toISOString() },
            { merge: true }
        );
    }

    console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .then(() => process.exit(0));
