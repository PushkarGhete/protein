import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');

const copy = {
  'citrulline-malate': {
    name: 'Citrulline Malate',
    category: 'Aminos',
    goal: 'Perform',
    badge: 'Pump',
    tagline: 'A nitric-oxide amino for blood flow, pump, and sets that do not fade early.',
    description:
      'Citrulline malate is the unflavoured pouch for lifters who already have a pre-workout and want more blood flow under it. It mixes clear and sits well beside creatine on a training day.',
    highlights: ['Pump and endurance support', 'Unflavoured, easy to mix', '100g pouch'],
    howToUse: 'Stir one serving into water before training, or add it to a pre-workout you already use.',
  },
  eaa: {
    name: 'EAA',
    category: 'Aminos',
    goal: 'Recover',
    badge: 'All nine',
    tagline: 'Essential amino acids for repair and hydration when the session runs long.',
    description:
      'A complete EAA formula for intra-workout sipping or the gap between meals. Lychee keeps it light. Useful on days when whole meals are hard to time around training.',
    highlights: ['All nine essential amino acids', 'Lychee', '450g'],
    howToUse: 'Sip during training or between meals. Follow the scoop on the tub.',
  },
  'l-glutamine': {
    name: 'L-Glutamine',
    category: 'Aminos',
    goal: 'Recover',
    badge: '',
    tagline: 'A plain recovery amino for sore muscles and the next session.',
    description:
      'Unflavoured glutamine for people who train often and want a simple add-in. It disappears into water, juice, or a shake.',
    highlights: ['Unflavoured', 'Recovery support', '150g'],
    howToUse: 'Mix a serving after training, or once a day on rest days. See the tub for the scoop.',
  },
  'ultimate-bcaa': {
    name: 'Ultimate BCAA',
    category: 'Aminos',
    goal: 'Recover',
    badge: '2:1:1',
    tagline: 'A 2:1:1 amino blend with glutamine and electrolytes.',
    description:
      'Built for the bottle you carry onto the floor. Glutamine and electrolytes sit with the amino blend, so one scoop covers hydration and recovery sipping.',
    highlights: ['2:1:1 BCAA ratio', 'Glutamine and electrolytes', '300g, six flavours'],
    howToUse: 'Mix one scoop in cold water and sip through the session.',
    featured: true,
  },
  creatine: {
    name: 'Creatine Monohydrate Micronised',
    category: 'Creatine',
    goal: 'Perform',
    badge: 'Daily',
    tagline: 'Micronised creatine for strength, power, and work you can repeat.',
    description:
      'A fine-milled creatine monohydrate that stirs cleaner than standard powder. Take it every day. Timing matters less than not skipping it. Unflavoured and flavoured tubs are both on the shelf.',
    highlights: ['Micronised for mixing', 'Strength and power', 'Unflavoured 250g and flavoured 300g'],
    howToUse: 'Take 3–5g daily in water or a shake. A loading week is optional. Daily use is the part that works.',
    featured: true,
    bestseller: true,
  },
  'super-charge': {
    name: 'SuperCharge',
    category: 'Energy',
    goal: 'Hydrate',
    badge: 'No caffeine',
    tagline: 'A caffeine-free isotonic drink with electrolytes and vitamin C.',
    description:
      'For long sessions, outdoor heat, and anyone who wants the bottle without a stimulant. Electrolytes and vitamin C, in the flavours people actually finish.',
    highlights: ['Caffeine-free', 'Electrolytes and vitamin C', '300g'],
    howToUse: 'Mix with cold water and drink through training or any long day on your feet.',
  },
  'overdose-preworkout': {
    name: 'Overdose Pre-Workout',
    category: 'Pre-Workout',
    goal: 'Perform',
    badge: 'High stim',
    tagline: 'Citrulline, beta-alanine, creatine HCl and caffeine for a loud session.',
    description:
      'A high-stimulant pre-workout for people who already know their caffeine tolerance. The blend leans on citrulline, beta-alanine, creatine HCl, arginine AKG and caffeine. The 100g pouch is the way to test a flavour before the 300g tub.',
    highlights: ['High stimulant', 'Citrulline, beta-alanine, creatine HCl', '100g and 300g'],
    howToUse:
      'Mix one serving with cold water 20–30 minutes before training. New to high-stim products? Start with half a scoop. Do not stack it with other caffeine.',
    featured: true,
    bestseller: true,
  },
  'lean-muscle-builder': {
    name: 'Lean Muscle Builder',
    category: 'Gainers',
    goal: 'Build',
    badge: '1:3',
    tagline: 'A 1:3 protein-to-carb gainer with creatine and glutamine.',
    description:
      'The calmer gainer. A 1:3 protein-to-carb ratio, with creatine and glutamine, for people adding size without jumping to a very heavy carb formula.',
    highlights: ['1:3 protein-to-carb ratio', 'Creatine and glutamine', '1kg, 3kg and 5kg'],
    howToUse: 'Mix with milk or water between meals, or after training. Use the scoop on the pack.',
  },
  'massive-muscle': {
    name: 'Massive Muscle Gainer',
    category: 'Gainers',
    goal: 'Build',
    badge: 'Hard gainer',
    tagline: 'A heavy 1:8 gainer for people who struggle to eat enough.',
    description:
      'About 30g of protein and 230g of carbs in a serving, at a 1:8 ratio. This is the tub for hard gainers who have already tried to eat more food and still need calories they can drink.',
    highlights: ['Around 30g protein a serving', 'Around 230g carbs a serving', '1kg, 3kg and 5kg'],
    howToUse: 'One serving between meals. Milk makes it richer. Water keeps it lighter.',
    featured: true,
    bestseller: true,
  },
  'iso-90': {
    name: 'ISO 90 Whey Protein',
    category: 'Whey',
    goal: 'Cut',
    badge: 'Isolate',
    tagline: 'Whey isolate with no added sugar and no added carbs.',
    description:
      'The lean tub. Ultra-filtered whey isolate for cutting phases and anyone who wants protein without a dessert-level carb count. No added sugar, no added carbs.',
    highlights: ['Whey protein isolate', 'No added sugar', 'No added carbs', '1kg, 2kg and 4kg'],
    howToUse: 'Shake one scoop with cold water. Milk is fine if you want it thicker. Use around training or whenever a meal is short on protein.',
    featured: true,
    bestseller: true,
  },
  'nitro-whey': {
    name: 'Nitro Whey',
    category: 'Whey',
    goal: 'Build',
    badge: 'Isolate +',
    tagline: 'Whey isolate with 3g creatine and 2g glutamine in the formula.',
    description:
      'A performance isolate for lifters who want protein, creatine and glutamine in one tub instead of three scoops. Sold as a 2.27kg pack.',
    highlights: ['Whey isolate', '3g creatine', '2g glutamine', '2.27kg'],
    howToUse: 'One shake a day covers the creatine habit as well as protein, if you take it daily.',
    featured: true,
  },
  'build-whey': {
    name: 'Build Whey',
    category: 'Whey',
    goal: 'Build',
    badge: '',
    tagline: 'Concentrate and isolate together, with glutamine for the build.',
    description:
      'An everyday whey for adding muscle: concentrate plus isolate, glutamine in the blend, and a carb count that stays modest. Cappuccino, double chocolate and mango.',
    highlights: ['Concentrate and isolate', 'Added glutamine', '1kg, 2kg and 4kg'],
    howToUse: 'One or two scoops a day, in water or milk, on top of normal meals.',
  },
  'premium-whey': {
    name: 'Premium Whey',
    category: 'Whey',
    goal: 'Build',
    badge: '',
    tagline: 'Whey concentrate with digestive enzymes and richer flavours.',
    description:
      'The easy daily whey. Concentrate, digestive enzymes, and flavours that lean Indian: chocolate, kesar kulfi and rose milk.',
    highlights: ['Whey concentrate', 'Digestive enzymes', '1kg, 2kg and 4kg'],
    howToUse: 'Mix a scoop with cold milk or water. Enzymes are there to make the shake easier to finish.',
  },
  'raw-unflavored': {
    name: 'RAW+ Whey',
    category: 'Whey',
    goal: 'Build',
    badge: 'Plain',
    tagline: 'Unflavoured concentrate with enzymes and no added sugar.',
    description:
      'For oats, smoothies and people who are done with flavour. Clean whey concentrate, digestive enzymes, no added sugar, one kilo.',
    highlights: ['Unflavoured', 'No added sugar', 'Digestive enzymes', '1kg'],
    howToUse: 'Blend into oats, milk or a fruit shake. It will taste like whatever you mix it with.',
  },
};

const sizeRe = /^\s*\d+(\.\d+)?\s?(g|kg)\s*$/i;

function pair(a, b) {
  const left = String(a ?? '').trim();
  const right = String(b ?? '').trim();
  const tidy = (value) => value.replace(/\s+/g, '');
  if (sizeRe.test(left) && !sizeRe.test(right)) {
    return { flavour: right || 'Unflavoured', weight: tidy(left) };
  }
  if (sizeRe.test(right) && !sizeRe.test(left)) {
    return { flavour: left || 'Unflavoured', weight: tidy(right) };
  }
  return { flavour: left || 'Standard', weight: right ? tidy(right) : '' };
}

function daysAgo(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

function makeLine(products, slug, index, qty) {
  const product = products.find((item) => item.id === slug);
  const variant = product.variants[index];
  return {
    productId: product.id,
    variantId: variant.id,
    name: product.name,
    slug: product.slug,
    flavour: variant.flavour,
    weight: variant.weight,
    price: variant.price,
    qty,
    image: variant.image || product.images[0] || '',
  };
}

function makeOrder(base, lines) {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  return {
    ...base,
    sample: true,
    payment: 'Cash on delivery',
    note: base.note || '',
    lines,
    subtotal,
    total: subtotal + base.shipping,
  };
}

export function buildSeed() {
  const catalog = JSON.parse(fs.readFileSync(path.join(dataDir, 'catalog.json'), 'utf8'));
  const products = catalog.map((item) => {
    const story = copy[item.handle];
    if (!story) return null;
    const variants = item.variants.map((variant, index) => {
      const named = pair(variant.flavour, variant.weight);
      return {
        id: `${item.handle}-${index + 1}`,
        flavour: named.flavour,
        weight: named.weight,
        price: variant.price,
        mrp: variant.mrp,
        stock: 18 + (index % 4) * 4,
        image: variant.image || null,
      };
    });
    return {
      id: item.handle,
      slug: item.handle,
      brand: 'Legendary Sports Nutrition',
      name: story.name,
      category: story.category,
      goal: story.goal,
      badge: story.badge || '',
      tagline: story.tagline,
      description: story.description,
      highlights: story.highlights,
      howToUse: story.howToUse,
      images: (item.images || []).slice(0, 5),
      featured: Boolean(story.featured),
      bestseller: Boolean(story.bestseller),
      active: true,
      variants,
    };
  }).filter(Boolean);

  const low = (slug, index, stock) => {
    const product = products.find((item) => item.id === slug);
    if (product?.variants[index]) product.variants[index].stock = stock;
  };
  low('creatine', 1, 3);
  low('raw-unflavored', 0, 2);
  low('nitro-whey', 1, 4);

  const orders = [
    makeOrder(
      {
        id: 'MPS-1001',
        code: 'MPS-1001',
        createdAt: daysAgo(6),
        status: 'Delivered',
        fulfillment: 'pickup',
        shipping: 0,
        shippingLabel: 'Counter pickup',
        customer: {
          name: 'Rahul Jadhav',
          phone: '9822011456',
          email: '',
          address: 'Karale Layout counter',
          city: 'Buldhana',
          pincode: '443001',
        },
        note: 'Collected from the counter.',
      },
      [makeLine(products, 'overdose-preworkout', 0, 1), makeLine(products, 'creatine', 0, 1)]
    ),
    makeOrder(
      {
        id: 'MPS-1002',
        code: 'MPS-1002',
        createdAt: daysAgo(2),
        status: 'Out for delivery',
        fulfillment: 'delivery',
        shipping: 0,
        shippingLabel: 'Free in Buldhana',
        customer: {
          name: 'Sneha Kale',
          phone: '9765432108',
          email: 'sneha.kale@email.com',
          address: 'Near bus stand, Shastri Nagar',
          city: 'Buldhana',
          pincode: '443001',
        },
        note: 'Call before arriving.',
      },
      [makeLine(products, 'iso-90', 0, 1)]
    ),
    makeOrder(
      {
        id: 'MPS-1003',
        code: 'MPS-1003',
        createdAt: daysAgo(1),
        status: 'Confirmed',
        fulfillment: 'delivery',
        shipping: 99,
        shippingLabel: 'Delivery',
        customer: {
          name: 'Amit Patel',
          phone: '9011223344',
          email: '',
          address: 'College road, house 18',
          city: 'Khamgaon',
          pincode: '444303',
        },
      },
      [makeLine(products, 'massive-muscle', 0, 1)]
    ),
    makeOrder(
      {
        id: 'MPS-1004',
        code: 'MPS-1004',
        createdAt: daysAgo(0),
        status: 'Placed',
        fulfillment: 'delivery',
        shipping: 0,
        shippingLabel: 'Free in Buldhana',
        customer: {
          name: 'Pooja Ingle',
          phone: '8899001122',
          email: '',
          address: 'Karale Layout, lane 3',
          city: 'Buldhana',
          pincode: '443001',
        },
        note: 'Leave with the shop next door if I am at the gym.',
      },
      [makeLine(products, 'ultimate-bcaa', 0, 1), makeLine(products, 'l-glutamine', 0, 1)]
    ),
    makeOrder(
      {
        id: 'MPS-1005',
        code: 'MPS-1005',
        createdAt: daysAgo(4),
        status: 'Cancelled',
        fulfillment: 'delivery',
        shipping: 99,
        shippingLabel: 'Delivery',
        customer: {
          name: 'Imran Shaikh',
          phone: '9988776655',
          email: '',
          address: 'Station road',
          city: 'Malkapur',
          pincode: '443101',
        },
        note: 'Customer cancelled before packing.',
      },
      [makeLine(products, 'build-whey', 0, 1)]
    ),
  ];

  return {
    meta: { nextOrder: 1006, nextEnquiry: 1002 },
    admin: {
      email: 'admin@majboot.shop',
      passwordHash: bcrypt.hashSync('Majboot#23532', 10),
    },
    settings: {
      announcement: 'Authorised Legendary Sports Nutrition counter · Karale Layout, Buldhana',
      phone: '+91 93705 23532',
      whatsapp: '919370523532',
      instagram: 'https://www.instagram.com/majboot_protein',
      instagramHandle: '@majboot_protein',
      address: 'Karale Layout, Buldhana, Maharashtra',
      hours: 'Ask on WhatsApp for today’s counter timing',
      freeShipOver: 2499,
      flatShip: 99,
      email: 'admin@majboot.shop',
    },
    products,
    orders,
    enquiries: [
      {
        id: 'ENQ-1001',
        name: 'Vikas More',
        phone: '9876501234',
        message: 'Do you have ISO 90 chocolate in 2kg at the counter today?',
        createdAt: daysAgo(1),
        read: false,
      },
    ],
  };
}
