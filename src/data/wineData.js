export const RED_WINE_COLORS = [
  {
    id: 'purple',
    name: 'Purple / Violet',
    hex: '#5c133a',
    lightHex: '#8e235b',
    description: 'Vibrant blue-purple rim. Indicates very young, high-anthocyanin wine.',
    ageIndicator: 'Youthful (0-2 years)',
    commonGrapes: 'Syrah/Shiraz, Malbec, Young Petite Sirah, Gamay'
  },
  {
    id: 'ruby',
    name: 'Ruby',
    hex: '#7e1022',
    lightHex: '#b81d40',
    description: 'Classic rich deep red with bright magenta rim. Standard for youthful to mid-age reds.',
    ageIndicator: 'Young to Mid-Age (1-5 years)',
    commonGrapes: 'Cabernet Sauvignon, Merlot, Tempranillo, Sangiovese'
  },
  {
    id: 'garnet',
    name: 'Garnet',
    hex: '#701c18',
    lightHex: '#9c2f27',
    description: 'Reddish-orange hue with subtle ruby core. Common in naturally lighter grapes or aging reds.',
    ageIndicator: 'Maturing (5-10 years or naturally translucent)',
    commonGrapes: 'Pinot Noir, Nebbiolo, Grenache, Aged Bordeaux'
  },
  {
    id: 'tawny',
    name: 'Tawny',
    hex: '#692a18',
    lightHex: '#994429',
    description: 'Warm reddish-brown tint with amber or orange rim variation.',
    ageIndicator: 'Aged / Fully Developed (10-20+ years)',
    commonGrapes: 'Aged Barolo, Tawny Port, Aged Rioja Gran Reserva'
  },
  {
    id: 'brick',
    name: 'Brick Red / Mahogany',
    hex: '#522215',
    lightHex: '#803c28',
    description: 'Brownish-brick tone throughout, muted saturation.',
    ageIndicator: 'Very Old / Tertiary Peak (20+ years)',
    commonGrapes: 'Mature Brunello, Vintage Port, Ancient Burgundy'
  }
];

export const RED_WINE_AROMAS = {
  primary: [
    { category: 'Red Fruit', items: ['Red Cherry', 'Raspberry', 'Strawberry', 'Cranberry', 'Red Plum', 'Pomegranate'] },
    { category: 'Black Fruit', items: ['Blackberry', 'Blackcurrant', 'Black Cherry', 'Black Plum', 'Blueberry'] },
    { category: 'Floral & Herbaceous', items: ['Violet', 'Rose Petal', 'Eucalyptus/Mint', 'Green Bell Pepper', 'Dried Herbs', 'Lavender'] },
    { category: 'Spice & Pepper', items: ['Black Pepper', 'White Pepper', 'Liquorice/Anise', 'Clove', 'Cinnamon'] }
  ],
  secondary: [
    { category: 'Oak Influences', items: ['Vanilla', 'Cedar', 'Toast', 'Smoke', 'Coconut', 'Dill', 'Sweet Tobacco'] },
    { category: 'Winemaking', items: ['Butter/Cream', 'Yeast/Biscuit', 'Chocolate', 'Coffee/Espresso', 'Cocoa'] }
  ],
  tertiary: [
    { category: 'Aging & Maturation', items: ['Leather', 'Forest Floor', 'Mushroom', 'Game/Meat', 'Truffle', 'Cigar Box'] },
    { category: 'Dried Fruit & Earth', items: ['Prune', 'Raisin', 'Dried Fig', 'Wet Leaves', 'Graphite/Lead Pencil', 'Tar'] }
  ]
};

export const SAMPLE_NOTES = [
  {
    id: 'sample-1',
    wineName: 'Château Margaux Grand Cru 2016',
    vintage: '2016',
    grape: 'Cabernet Sauvignon',
    country: 'France',
    region: 'Bordeaux (Margaux)',
    alcohol: '13.5%',
    date: '2026-07-28',
    color: {
      id: 'ruby',
      name: 'Ruby',
      hex: '#7e1022',
      intensity: 'Deep',
      clarity: 'Clear',
      rimVariation: 'Subtle Magenta Rim'
    },
    nose: {
      intensity: 'Pronounced',
      development: 'Developing',
      aromas: ['Blackcurrant', 'Violet', 'Cedar', 'Cigar Box', 'Graphite/Lead Pencil', 'Vanilla']
    },
    palate: {
      sweetness: 'Dry',
      acidity: 'High',
      tannin: 'Medium(+)',
      alcoholLevel: 'Medium',
      body: 'Full',
      flavorIntensity: 'Pronounced',
      finish: 'Long (45s+)'
    },
    conclusion: {
      score: 98,
      price: '$850',
      quality: 'Outstanding',
      drinkWindow: 'Can drink now, but has potential for aging 20+ years',
      notes: 'Silky refined tannins with incredible floral-blackcurrant precision. Outstanding elegance and long finish.'
    }
  },
  {
    id: 'sample-2',
    wineName: 'Domaine Serene Evenstad Reserve 2019',
    vintage: '2019',
    grape: 'Pinot Noir',
    country: 'USA',
    region: 'Willamette Valley, Oregon',
    alcohol: '14.1%',
    date: '2026-07-20',
    color: {
      id: 'garnet',
      name: 'Garnet',
      hex: '#701c18',
      intensity: 'Medium',
      clarity: 'Clear',
      rimVariation: 'Pale Garnet Rim'
    },
    nose: {
      intensity: 'Medium(+)',
      development: 'Youthful',
      aromas: ['Red Cherry', 'Raspberry', 'Forest Floor', 'Cinnamon', 'Toast']
    },
    palate: {
      sweetness: 'Dry',
      acidity: 'High',
      tannin: 'Medium',
      alcoholLevel: 'Medium(+)',
      body: 'Medium(+)',
      flavorIntensity: 'Medium(+)',
      finish: 'Medium(+)'
    },
    conclusion: {
      score: 94,
      price: '$95',
      quality: 'Very Good',
      drinkWindow: 'Drink now or hold 5-8 years',
      notes: 'Bright acidity framing ripe red fruits with savory mushroom underline. Exceptionally balanced Pinot Noir.'
    }
  }
];
