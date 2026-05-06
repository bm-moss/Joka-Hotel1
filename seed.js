// Run once: node seed.js
const bcrypt = require('bcryptjs');
const fs     = require('fs');

const db = {
  users: [
    { id:'u1', username:'admin',    role:'admin',   name:'Admin User',    password: bcrypt.hashSync('admin2026', 10) },
    { id:'u2', username:'cashier1', role:'cashier', name:'Cashier One',   password: bcrypt.hashSync('password',  10) },
    { id:'u3', username:'kitchen1', role:'kitchen', name:'Kitchen Staff', password: bcrypt.hashSync('password',  10) },
    { id:'u4', username:'chef1',    role:'chef',    name:'Head Chef',     password: bcrypt.hashSync('chef2026',  10) }
  ],
  orders: [],
  inventory: [
    { id:'i1',  materialName:'Teff Flour',    amharicName:'ጤፍ ዱቄት',    quantity:50,  unit:'kg',      minThreshold:10, costPerUnit:45  },
    { id:'i2',  materialName:'Cooking Oil',   amharicName:'የምግብ ዘይት',  quantity:20,  unit:'liters',  minThreshold:5,  costPerUnit:120 },
    { id:'i3',  materialName:'Chicken',       amharicName:'ዶሮ',         quantity:30,  unit:'kg',      minThreshold:8,  costPerUnit:280 },
    { id:'i4',  materialName:'Beef',          amharicName:'የበሬ ስጋ',    quantity:25,  unit:'kg',      minThreshold:8,  costPerUnit:450 },
    { id:'i5',  materialName:'Onion',         amharicName:'ሽንኩርት',     quantity:40,  unit:'kg',      minThreshold:10, costPerUnit:25  },
    { id:'i6',  materialName:'Tomato',        amharicName:'ቲማቲም',      quantity:35,  unit:'kg',      minThreshold:10, costPerUnit:30  },
    { id:'i7',  materialName:'Berbere Spice', amharicName:'በርበሬ',       quantity:15,  unit:'kg',      minThreshold:3,  costPerUnit:180 },
    { id:'i8',  materialName:'Soft Drinks',   amharicName:'ለስላሳ መጠጥ', quantity:120, unit:'bottles', minThreshold:24, costPerUnit:25  },
    { id:'i9',  materialName:'Beer',          amharicName:'ቢራ',         quantity:96,  unit:'bottles', minThreshold:24, costPerUnit:45  },
    { id:'i10', materialName:'Coffee Beans',  amharicName:'ቡና',         quantity:10,  unit:'kg',      minThreshold:2,  costPerUnit:350 }
  ],
  menuItems: [
    { id:'m1',  name:'Tibs',             amharicName:'ጥብስ',         price:180, category:'Food', description:'Sauteed meat with vegetables'         },
    { id:'m2',  name:'Injera with Wot',  amharicName:'እንጀራ ከወጥ',  price:120, category:'Food', description:'Traditional Ethiopian bread with stew' },
    { id:'m3',  name:'Kitfo',            amharicName:'ክትፎ',         price:200, category:'Food', description:'Ethiopian minced raw beef'             },
    { id:'m4',  name:'Doro Wot',         amharicName:'ዶሮ ወጥ',      price:160, category:'Food', description:'Spicy chicken stew'                   },
    { id:'m5',  name:'Shiro',            amharicName:'ሽሮ',          price:90,  category:'Food', description:'Chickpea powder stew'                 },
    { id:'m6',  name:'Firfir',           amharicName:'ፍርፍር',        price:100, category:'Food', description:'Torn injera with sauce'               },
    { id:'m7',  name:'Soft Drink',       amharicName:'ለስላሳ',        price:35,  category:'Bar',  description:'Pepsi, Coca-Cola, Sprite'             },
    { id:'m8',  name:'Beer',             amharicName:'ቢራ',          price:65,  category:'Bar',  description:'Local or imported beer'               },
    { id:'m9',  name:'Ethiopian Coffee', amharicName:'የኢትዮጵያ ቡና', price:45,  category:'Bar',  description:'Traditional coffee ceremony'          },
    { id:'m10', name:'Juice',            amharicName:'ጁስ',          price:55,  category:'Bar',  description:'Fresh fruit juice'                    },
    { id:'m11', name:'Water',            amharicName:'ውሃ',          price:20,  category:'Bar',  description:'Bottled water'                        },
    { id:'m12', name:'Pasta',            amharicName:'ፓስታ',         price:110, category:'Food', description:'Spaghetti with sauce'                 }
  ],
  auditLog: []
};

fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
console.log('✅ db.json seeded');
console.log('Logins:');
console.log('  admin    / admin2026');
console.log('  cashier1 / password');
console.log('  kitchen1 / password');
console.log('  chef1    / chef2026');
