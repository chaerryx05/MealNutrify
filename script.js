// ═══════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════
const API_KEYS = [
  "d00d0f76699a4116887d2d80454a2082",  // Primary key rochelle api key - d00d0f76699a4116887d2d80454a2082
  "3bdcf2d203934e41bb72e7d4c1194af2",  // Backup key cherry api key - 3bdcf2d203934e41bb72e7d4c1194af2
];
const BASE = "https://api.spoonacular.com";
const PER_PAGE = 12;

// Tracks which key is active for this session (auto-rotates on quota/auth failure)
let activeKeyIndex = 0;

async function spoonacularFetch(url, keyIndex = activeKeyIndex) {
  const u = new URL(url);
  u.searchParams.set("apiKey", API_KEYS[keyIndex]);
  const res = await fetch(u.toString());
  // 402 = quota exceeded, 401 = invalid key → try next key
  if ((res.status === 402 || res.status === 401) && keyIndex < API_KEYS.length - 1) {
    console.warn(`Spoonacular key [${keyIndex}] failed (${res.status}), switching to backup key [${keyIndex + 1}]…`);
    activeKeyIndex = keyIndex + 1;
    return spoonacularFetch(url, activeKeyIndex);
  }
  return res;
}

// ═══════════════════════════════════════════════════════════
// 🌍 GLOBAL FEATURED CUISINE CATEGORIES
// ═══════════════════════════════════════════════════════════
const GLOBAL_FEATURED = [
  { label: "Pasta", query: "pasta", img: "https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=640&q=75" },
  { label: "Grilled", query: "grilled chicken", img: "https://www.jocooks.com/wp-content/uploads/2022/07/grilled-chicken-breast-1-21.jpg" },
  { label: "Salads", query: "salad", img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=640&q=75" },
  { label: "Soups", query: "soup", img: "https://images.unsplash.com/photo-1547592180-85f173990554?w=640&q=75" },
  { label: "Burgers", query: "burger", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=640&q=75" },
  { label: "Seafood", query: "seafood", img: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=640&q=75" },
  { label: "Breakfast", query: "breakfast", img: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=640&q=75" },
  { label: "Desserts", query: "dessert", img: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=640&q=75" },
  { label: "Stir Fry", query: "stir fry", img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=640&q=75" },
  { label: "Tacos", query: "tacos", img: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=640&q=75" },
  { label: "Pizza", query: "pizza", img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=640&q=75" },
  { label: "Drinks", query: "drinks", img: "https://imgk.timesnownews.com/Fruit_Drinks_.jpg" },
];

function renderGlobalFeatured() {
  const wrap = document.getElementById('globalFeatured');
  if (!wrap) return;
  wrap.innerHTML = `
    <div class="feat-header">
      <div class="feat-title">Explore International Cuisine</div>
    </div>
    <div class="feat-grid">
      ${GLOBAL_FEATURED.map(c => `
        <div class="feat-card" onclick="featSearch('${c.query}', '${c.label}')">
          <img src="${c.img}" alt="${c.label}" loading="lazy"
               onerror="this.style.display='none'"/>
          <div class="feat-overlay"></div>
          <div class="feat-label">${c.label}</div>
        </div>
      `).join('')}
    </div>`;
}

function showGlobalFeatured() {
  const featEl = document.getElementById('globalFeatured');
  const backBar = document.getElementById('globalBackBar');
  const recipeGrid = document.getElementById('recipeGrid');
  const pagination = document.getElementById('pagination');
  const emptyResult = document.getElementById('emptyResult');
  const errorBox = document.getElementById('errorBox');
  const totalCount = document.getElementById('totalCount');
  if (featEl) featEl.style.display = 'block';
  if (backBar) backBar.style.display = 'none';
  if (recipeGrid) recipeGrid.innerHTML = '';
  if (pagination) pagination.style.display = 'none';
  if (emptyResult) emptyResult.style.display = 'none';
  if (errorBox) errorBox.style.display = 'none';
  if (totalCount) totalCount.textContent = '';
  document.getElementById('searchInput').value = '';
}

function featSearch(query, label) {
  const input = document.getElementById('searchInput');
  input.value = query;
  const featEl = document.getElementById('globalFeatured');
  if (featEl) featEl.style.display = 'none';
  const backBar = document.getElementById('globalBackBar');
  if (backBar) {
    backBar.style.display = 'flex';
    const lbl = document.getElementById('globalBackLabel');
    if (lbl) lbl.textContent = label || query;
  }
  doSearch(0);
}

// ═══════════════════════════════════════════════════════════
// 🇵🇭 FILIPINO DATABASE — 80 authentic dishes
// ═══════════════════════════════════════════════════════════
// ─── Real food images (Wikimedia Commons) ───────────────────────────────
const PH_IMG = {
  ph001: "https://www.budgetbytes.com/wp-content/uploads/2018/02/Chicken-Adobo-Vertical-2-1152x1536.jpg",
  ph002: "https://hips.hearstapps.com/vidthumb/images/pork-adobo-1-jpg-1654712703.jpg",
  ph003: "https://speedyrecipe.com/wp-content/uploads/2022/09/how-to-cook-sinigang-na-baboy.jpg",
  ph004: "https://assets.unileversolutions.com/recipes-v2/214403.jpg",
  ph005: "https://www.manilaspoon.com/wp-content/uploads/2024/02/KareKare2-1.jpg",
  ph006: "https://static01.nyt.com/images/2023/11/28/multimedia/ND-Lechon-Kawali-bflv/ND-Lechon-Kawali-bflv-threeByTwoMediumAt2X.jpg",
  ph007: "https://www.billyparisi.com/wp-content/uploads/2025/02/bistek-tagalog-3.jpg",
  ph008: "https://amiablefoods.com/wp-content/uploads/tinolang-manok-recipe-card.jpg",
  ph009: "https://i.pinimg.com/originals/d4/93/23/d493235f20e3876912547a7238ff1022.jpg",
  ph010: "https://boondockingrecipes.com/wp-content/uploads/2025/01/27.-Filipino-Beef-Mechado-Recipe-2-768x508.jpg",
  ph011: "https://theskinnypot.com/wp-content/uploads/2023/11/Chicken-Afritada-with-Tomato-Sauce-800x1200.jpg",
  ph012: "https://panlasangpinoy.com/wp-content/uploads/2017/12/Filipino-Pork-Menudo-Recipe-.jpg",
  ph013: "https://i.pinimg.com/originals/03/01/ed/0301ed79f68d2f3ef0af6a61f0b82143.jpg",
  ph014: "https://assets.unileversolutions.com/v1/89746311.jpg",
  ph015: "https://i.pinimg.com/originals/44/e1/76/44e17655f3864e91a766099f70f2048b.jpg",
  ph016: "https://i.pinimg.com/originals/3c/3e/cc/3c3ecc439ba98330e6f233bf07bf2350.jpg",
  ph017: "https://yummykitchentv.com/wp-content/uploads/2021/06/pinakbet-recipe.jpg",
  ph018: "https://i.pinimg.com/originals/1d/33/87/1d3387fbdd4cc90059365b02c542f955.jpg",
  ph019: "https://www.kawalingpinoy.com/wp-content/uploads/2020/06/authentic-chicken-inasal-8.jpg",
  ph020: "https://i.pinimg.com/originals/98/db/4f/98db4fcd46308bc09aa9e41fb1abb849.jpg",
  ph021: "https://i.pinimg.com/originals/47/2f/a7/472fa76f46f05e55aabf2afcc4467609.jpg",
  ph022: "https://i.pinimg.com/originals/39/b4/36/39b4362258c3a30abb1a72f6cb0d73b1.jpg",
  ph023: "https://www.seriouseats.com/thmb/cI2OJX-FEpCuGTmn0priBpwK6XA=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/__opt__aboutcom__coeus__resources__content_migration__serious_eats__seriouseats.com__2019__11__20191030-filipino-pancit-palabok-vicky-wasik-32-6e6689568e134ca187290918c8558c09.jpg",
  ph024: "https://assets.unileversolutions.com/recipes-v3/110814-default.jpg",
  ph025: "https://www.curiouscuisiniere.com/wp-content/uploads/2018/05/Filipino-Garlic-Fried-Rice-Sinangag-5650-1.jpg",
  ph026: "https://1.bp.blogspot.com/-JXSqjHSTT5I/XI3LBYaS59I/AAAAAAAASfQ/CCZjxMweSAYKyMCELq9iQCuOyjjLcyMGgCLcBGAs/s1600/Arroz%2BCaldo.jpg",
  ph027: "https://www.kawalingpinoy.com/wp-content/uploads/2020/11/goto-lugaw-675x900.jpg",
  ph028: "https://thefoodietakesflight.com/wp-content/uploads/2020/10/Lumpiang-Shanghai.jpg",
  ph029: "https://yummykitchentv.com/wp-content/uploads/2023/02/tokwat-baboy-recipe-01-1024x612.jpg",
  ph030: "https://sp-ao.shortpixel.ai/client/to_webp,q_glossy,ret_img/https://blog.airpaz.com/wp-content/uploads/Isaw-R-min.jpg",
  ph031: "https://i.pinimg.com/originals/7b/39/93/7b39938a51b44a1a4325d982cd0f6477.jpg",
  ph032: "https://cdn.tatlerasia.com/asiatatler/i/ph/2021/03/15143056-kristian-ryan-alimon-5uiq2enxnra-unsplash_cover_2000x1285.jpg",
  ph033: "https://1.bp.blogspot.com/-YvVf0hKwoIk/XqhHEY6mJ_I/AAAAAAAAUuY/OzN4Yhy_o6EQHp9JTbF5VZcTxQx6E1YnQCLcBGAsYHQ/s1600/Kinilaw.jpg",
  ph034: "https://kusinaniteds.com/wp-content/uploads/2019/10/Oven-Grilled-Milkfish-1-scaled.jpeg",
  ph035: "https://yummykitchentv.com/wp-content/uploads/2021/04/adobong-pusit-recipe-01.jpg",
  ph036: "https://www.ajinomoto.com.ph/ajinomoto-static/web/wp-content/uploads/2020/03/Paksiw-na-Bangus.jpg",
  ph037: "https://www.foxyfolksy.com/wp-content/uploads/2021/06/bitter-melon-recipe.jpg",
  ph038: "https://theskinnypot.com/wp-content/uploads/2023/01/Ginataang-Kalabasa-with-Shrimp-pork-and-String-beans.jpg",
  ph039: "https://yummykitchentv.com/wp-content/uploads/2021/05/tortang-talong-recipe.jpg",
  ph040: "https://yummykitchentv.com/wp-content/uploads/2021/03/ginisang-munggo.jpg",
  ph041: "https://i.pinimg.com/originals/49/4a/28/494a28a1ac3af38ca19b2668bb023647.jpg",
  ph042: "https://getrecipe.org/wp-content/uploads/2019/10/1-1024x576.png",
  ph043: "https://as2.ftcdn.net/v2/jpg/05/18/24/77/1000_F_518247744_FZBTwJ2dYOOlfCD4M0OjdpkNEo3FiPQb.jpg",
  ph044: "https://www.thelittleepicurean.com/wp-content/uploads/2015/08/pandesal-filipino-bread-rolls-2.jpg",
  ph045: "https://alchetron.com/cdn/halo-halo-ebea05d5-32c9-494a-b084-8d5db32675f-resize-750.jpeg",
  ph046: "https://amiablefoods.com/wp-content/uploads/leche-flan-hero.jpg",
  ph047: "https://www.foxyfolksy.com/wp-content/uploads/2015/11/halaya-1024x1536.jpg",
  ph048: "https://i.pinimg.com/736x/ff/89/20/ff8920fb520971d2970e6e012fd32549.jpg",
  ph049: "https://deliciouslyrushed.com/wp-content/uploads/2024/06/Puto-1024x1024.jpg",
  ph050: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Turon_na_Saging.jpg/1280px-Turon_na_Saging.jpg",
  ph051: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Sticky_Rice_Cake_Biko.jpg/500px-Sticky_Rice_Cake_Biko.jpg",
  ph052: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Palitaw_Sm.jpg/500px-Palitaw_Sm.jpg",
  ph053: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Achara.jpg/500px-Achara.jpg",
  ph054: "https://pinoybites.com/wp-content/uploads/2021/10/shrimp4-1-scaled.jpg",
  ph055: "https://panlasangpinoy.com/wp-content/uploads/2010/01/Pork-Humba-Recipe-Filipino.jpg",
  ph056: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Crispy_Pata_Pork.jpg/500px-Crispy_Pata_Pork.jpg",
  ph057: "https://www.kawalingpinoy.com/wp-content/uploads/2018/08/spicy-binagoongan-baboy-5-1152x1536.jpg",
  ph058: "https://www.curiouscuisiniere.com/wp-content/uploads/2018/05/Tortang-Giniling-Filipino-Beef-Omelette-5666-450.2-320x180.jpg",
  ph059: "https://panlasangpinoy.com/wp-content/uploads/2018/11/How-to-Cook-Embutido-Panlasang-Pinoy.jpg",
  ph060: "https://www.thepeachkitchen.com/wp-content/uploads/2023/04/Pininyahang-Manok2.png",
  ph061: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiIM1ETbE5s-2Ls--tVgao0_11pG_6ezPBBQ&s",
  ph062: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6d_Wq3gAccrBGcmL5e5WAYgIQRUEapn5GwQ&s",
  ph063: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGpeN7mIDJAefMtD6wVnKirGDWta1EnYjQ9w&s",
  ph064: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRqQggRCxzxbptX_SSaoJs2XykIrHYCNiX4bw&s",
  ph065: "https://panlasangpinoy.com/wp-content/uploads/2016/08/Dinengdeng-Recipe.jpg",
  ph066: "https://panlasangpinoy.com/wp-content/uploads/2010/03/paksiw-na-lechon.jpg",
  ph067: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWd-jGQBSD94F1sC-MIncTuRQc6QWrjFWdwg&s",
  ph068: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_NNimmaamnTo_yNIfQfJ-IRz_YUKi-4cUSA&s",
  ph069: "https://i.ytimg.com/vi/xphYsAzeuvo/maxresdefault.jpg",
  ph070: "https://www.agoda.com/wp-content/uploads/2025/03/Buko-Juice.jpg",
  ph071: "https://tse3.mm.bing.net/th/id/OIP.M8-5HhFrB4fR8_YtNmdAlwHaJw?rs=1&pid=ImgDetMain&o=7&rm=3",
  ph072: "https://www.recipesbynora.com/wp-content/uploads/2023/12/Lugaw-Recipe-featured-image-1.jpg",
  ph073: "https://4.bp.blogspot.com/-jXBvpkTCF2s/UZXnduM6k4I/AAAAAAAAM7A/pLteQ-4lpkc/s1600/IMG_7074.JPG",
  ph074: "https://i.pinimg.com/originals/01/e1/0b/01e10bfe3b36f47b63a03e165907271d.jpg",
  ph075: "https://i.ytimg.com/vi/izZOt2GEqbY/maxresdefault.jpg",
  ph076: "https://www.foxyfolksy.com/wp-content/uploads/2014/09/longganisa-hamonado.jpg",
  ph077: "https://www.kawalingpinoy.com/wp-content/uploads/2015/02/ginataang-bilo-bilo-6.jpg",
  ph078: "https://kusinasecrets.com/wp-content/uploads/2024/11/u3317447599_httpss.mj_.run-g8JXerH-cQ_Close-up_of_triangular_s_91d4052e-fbcf-47f7-b232-a9ec2069c990_3.png",
  ph079: "https://www.pinoyrecipe.net/wp-content/uploads/2015/11/Kutsinta-Recipe-1.jpg",
  ph080: "https://sugbo.ph/wp-content/uploads/2022/04/how-to-make-taho-3-lirus-sanchez.jpg",
};
// Category fallbacks (Unsplash) — shown when a Wikimedia image fails to load
const CAT_FALLBACK = {
  "Main Dish": "https://images.unsplash.com/photo-1547592180-85f173990554?w=640&q=75",
  "Noodle Dish": "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=640&q=75",
  "Rice Dish": "https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=640&q=75",
  "Street Food": "https://images.unsplash.com/photo-1555126634-323283e090fa?w=640&q=75",
  "Seafood": "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=640&q=75",
  "Vegetable Dish": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=640&q=75",
  "Breakfast": "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=640&q=75",
  "Dessert": "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=640&q=75",
  "Side Dish": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=640&q=75",
  "Drink": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=640&q=75",
};
function getPHImg(dish) {
  return PH_IMG[dish.id] || CAT_FALLBACK[dish.category] || CAT_FALLBACK["Main Dish"];
}

const PH_DB = [
  // ── MAIN DISHES ──────────────────────────────────────────
  {
    id: "ph001", name: "Chicken Adobo", category: "Main Dish", region: "Nationwide", emoji: "🍗", cookTime: 45, servings: 4,
    desc: "The national dish — chicken braised in vinegar, soy sauce, garlic, and bay leaves.",
    ingredients: [{ a: "1 kg", n: "chicken, cut into pieces" }, { a: "½ cup", n: "white vinegar" }, { a: "¼ cup", n: "soy sauce" }, { a: "1 head", n: "garlic, crushed" }, { a: "3 pcs", n: "bay leaves" }, { a: "1 tsp", n: "whole black peppercorns" }, { a: "2 tbsp", n: "cooking oil" }],
    steps: ["Heat oil in a large pan over medium heat. Sauté garlic until lightly browned.", "Add the chicken pieces and cook until lightly golden on all sides, about 5 minutes.", "Pour in vinegar and soy sauce. Add bay leaves and peppercorns.", "Bring to a boil without stirring. Reduce heat, cover, and simmer for 25–30 minutes.", "Uncover and simmer an additional 10 minutes until sauce thickens and chicken is tender.", "Taste and adjust seasoning. Serve hot with steamed white rice."],
    nutrition: { calories: 320, protein: 28, carbs: 6, fat: 20, fiber: 0.3, sugar: 1, sodium: 860, cholesterol: 95, saturatedFat: 5.5, potassium: 380, calcium: 28, iron: 2.1 }
  },

  {
    id: "ph002", name: "Pork Adobo", category: "Main Dish", region: "Nationwide", emoji: "🥩", cookTime: 60, servings: 4,
    desc: "Tender pork belly slow-cooked in vinegar, soy sauce, garlic, and spices.",
    ingredients: [{ a: "1 kg", n: "pork belly, cut into chunks" }, { a: "½ cup", n: "white vinegar" }, { a: "¼ cup", n: "soy sauce" }, { a: "1 head", n: "garlic, crushed" }, { a: "3 pcs", n: "bay leaves" }, { a: "1 tsp", n: "black peppercorns" }, { a: "1 tbsp", n: "oil" }],
    steps: ["Marinate pork in soy sauce and garlic for at least 30 minutes.", "In a pot, combine marinated pork with vinegar, bay leaves, and peppercorns.", "Bring to a boil over high heat without stirring.", "Reduce heat to low, cover, and simmer for 40 minutes until pork is tender.", "Remove cover, increase heat, and cook until sauce reduces and slightly caramelizes.", "Serve with steamed rice."],
    nutrition: { calories: 415, protein: 24, carbs: 5, fat: 33, fiber: 0.2, sugar: 1, sodium: 920, cholesterol: 110, saturatedFat: 12, potassium: 340, calcium: 22, iron: 1.8 }
  },

  {
    id: "ph003", name: "Sinigang na Baboy", category: "Main Dish", region: "Nationwide", emoji: "🍲", cookTime: 75, servings: 6,
    desc: "Sour tamarind-based pork soup with kangkong, eggplant, radish, and green beans.",
    ingredients: [{ a: "1 kg", n: "pork ribs or belly" }, { a: "3 pcs", n: "medium tomatoes" }, { a: "1 pc", n: "medium onion" }, { a: "1 pack", n: "tamarind soup mix" }, { a: "1 cup", n: "kangkong leaves" }, { a: "1 pc", n: "eggplant, sliced" }, { a: "1 pc", n: "radish, sliced" }, { a: "100g", n: "sitaw (string beans)" }, { a: "2 pcs", n: "finger chili" }, { a: "Fish sauce to taste", n: "" }],
    steps: ["In a pot, bring 6–8 cups water to a boil. Add onion and tomatoes.", "Add pork and cook for 45 minutes until tender, skimming foam occasionally.", "Stir in tamarind mix or fresh tamarind extract. Season with fish sauce.", "Add radish and cook 5 minutes. Add eggplant and string beans, cook 3 minutes.", "Add kangkong and finger chili. Simmer 1–2 minutes.", "Taste and adjust sourness and saltiness. Serve immediately with rice."],
    nutrition: { calories: 285, protein: 22, carbs: 14, fat: 16, fiber: 3.2, sugar: 4, sodium: 780, cholesterol: 75, saturatedFat: 5.5, potassium: 620, calcium: 65, iron: 2.8 }
  },

  {
    id: "ph004", name: "Sinigang na Hipon", category: "Seafood", region: "Nationwide", emoji: "🦐", cookTime: 30, servings: 4,
    desc: "Light tamarind shrimp soup packed with vegetables — healthier and quick to prepare.",
    ingredients: [{ a: "500g", n: "medium shrimp, deveined" }, { a: "1 pack", n: "tamarind soup mix" }, { a: "2 pcs", n: "tomatoes" }, { a: "1 pc", n: "onion" }, { a: "1 pc", n: "eggplant, sliced" }, { a: "1 cup", n: "kangkong" }, { a: "100g", n: "radish, sliced" }, { a: "Fish sauce", n: "to taste" }],
    steps: ["Boil 6 cups of water. Add onion, tomatoes, and radish.", "Simmer 10 minutes then stir in tamarind mix. Season with fish sauce.", "Add shrimp and eggplant; cook 3–4 minutes until shrimp turns pink.", "Add kangkong and simmer 1 more minute.", "Serve hot with steamed rice."],
    nutrition: { calories: 190, protein: 20, carbs: 12, fat: 5, fiber: 3, sugar: 4, sodium: 720, cholesterol: 165, saturatedFat: 1, potassium: 580, calcium: 90, iron: 2.5 }
  },

  {
    id: "ph005", name: "Kare-Kare", category: "Main Dish", region: "Central Luzon", emoji: "🍛", cookTime: 180, servings: 6,
    desc: "Rich oxtail and vegetables stewed in a thick peanut-annatto sauce, served with bagoong alamang.",
    ingredients: [{ a: "1 kg", n: "oxtail, cut into sections" }, { a: "½ cup", n: "peanut butter" }, { a: "¼ cup", n: "ground toasted rice" }, { a: "2 tbsp", n: "annatto seeds (achuete)" }, { a: "1 pc", n: "banana blossom" }, { a: "1 pc", n: "eggplant" }, { a: "100g", n: "sitaw" }, { a: "1 bunch", n: "pechay" }, { a: "Bagoong alamang", n: "on the side" }],
    steps: ["Boil oxtail in salted water for 2–3 hours until very tender. Reserve broth.", "Soak annatto seeds in warm water; strain to get the orange liquid.", "In a large pot, sauté garlic and onion. Add oxtail and annatto water.", "Stir in peanut butter and ground rice, adding reserved broth to desired consistency.", "Simmer 20 minutes, stirring occasionally to prevent sticking.", "Add vegetables: banana blossom, eggplant, sitaw, pechay. Cook until tender.", "Serve with sautéed bagoong alamang on the side."],
    nutrition: { calories: 460, protein: 32, carbs: 18, fat: 30, fiber: 4, sugar: 3, sodium: 640, cholesterol: 105, saturatedFat: 9, potassium: 480, calcium: 55, iron: 3.2 }
  },

  {
    id: "ph006", name: "Lechon Kawali", category: "Main Dish", region: "Nationwide", emoji: "🍖", cookTime: 90, servings: 6,
    desc: "Deep-fried crispy pork belly — golden crackling skin with juicy tender meat inside.",
    ingredients: [{ a: "1 kg", n: "pork belly slab" }, { a: "1 head", n: "garlic" }, { a: "3 pcs", n: "bay leaves" }, { a: "1 tbsp", n: "salt" }, { a: "1 tsp", n: "black pepper" }, { a: "Oil", n: "for deep frying" }],
    steps: ["Boil pork belly in water with garlic, bay leaves, salt, and pepper for 45 minutes until tender.", "Remove and let drain on a rack. Pat very dry with paper towels.", "Let rest uncovered in the refrigerator for 2 hours (or overnight) to dry out the skin.", "Deep fry in hot oil (180°C) for 15–20 minutes, turning occasionally, until golden and crispy.", "Drain on paper towels. Rest 5 minutes before chopping.", "Serve with lechon sauce or spiced vinegar."],
    nutrition: { calories: 520, protein: 26, carbs: 2, fat: 45, fiber: 0, sugar: 0, sodium: 580, cholesterol: 130, saturatedFat: 16, potassium: 320, calcium: 18, iron: 1.6 }
  },

  {
    id: "ph007", name: "Bistek Tagalog", category: "Main Dish", region: "Tagalog", emoji: "🥩", cookTime: 35, servings: 4,
    desc: "Filipino beef steak marinated in soy sauce and calamansi, topped with caramelized onion rings.",
    ingredients: [{ a: "500g", n: "beef sirloin, thinly sliced" }, { a: "¼ cup", n: "soy sauce" }, { a: "3 tbsp", n: "calamansi juice" }, { a: "2 pcs", n: "large onions, sliced into rings" }, { a: "3 cloves", n: "garlic, minced" }, { a: "Oil", n: "for sautéing" }, { a: "Pepper", n: "to taste" }],
    steps: ["Marinate beef in soy sauce, calamansi juice, garlic, and pepper for 30 minutes.", "Heat oil in a pan. Sear onion rings over high heat until translucent; set aside.", "In same pan, fry beef slices for 2–3 minutes per side.", "Pour remaining marinade over the beef and simmer 5 minutes.", "Top with reserved caramelized onion rings.", "Serve over steamed rice."],
    nutrition: { calories: 310, protein: 30, carbs: 8, fat: 18, fiber: 0.5, sugar: 3, sodium: 840, cholesterol: 88, saturatedFat: 6, potassium: 450, calcium: 25, iron: 3.5 }
  },

  {
    id: "ph008", name: "Tinolang Manok", category: "Main Dish", region: "Nationwide", emoji: "🍗", cookTime: 40, servings: 5,
    desc: "Light ginger chicken soup with green papaya, malunggay, and chili leaves — a Filipino comfort classic.",
    ingredients: [{ a: "1 kg", n: "whole chicken, cut up" }, { a: "1 pc", n: "thumb-sized ginger, julienned" }, { a: "1 pc", n: "green papaya, diced" }, { a: "1 cup", n: "malunggay leaves" }, { a: "1 cup", n: "sili leaves" }, { a: "1 pc", n: "onion, quartered" }, { a: "3 cloves", n: "garlic, crushed" }, { a: "2 tbsp", n: "fish sauce" }, { a: "4 cups", n: "water" }],
    steps: ["Heat oil in a pot. Sauté ginger, garlic, and onion until fragrant.", "Add chicken pieces and cook until lightly browned, about 5 minutes.", "Pour in water and fish sauce. Bring to a boil, then simmer 20 minutes.", "Add green papaya and cook 8 minutes until tender.", "Add malunggay and sili leaves. Simmer 2 more minutes.", "Season to taste and serve hot."],
    nutrition: { calories: 195, protein: 24, carbs: 10, fat: 7, fiber: 2.5, sugar: 4, sodium: 560, cholesterol: 68, saturatedFat: 1.8, potassium: 520, calcium: 85, iron: 2.2 }
  },

  {
    id: "ph009", name: "Caldereta", category: "Main Dish", region: "Nationwide", emoji: "🍲", cookTime: 90, servings: 6,
    desc: "Hearty beef stew with liver paste, potatoes, carrots, and bell peppers in rich tomato sauce.",
    ingredients: [{ a: "1 kg", n: "beef (chuck or shank)" }, { a: "1 can", n: "liver spread or chopped pork liver" }, { a: "1 can", n: "tomato sauce" }, { a: "2 pcs", n: "potatoes, quartered" }, { a: "2 pcs", n: "carrots, sliced" }, { a: "1 pc", n: "red bell pepper" }, { a: "½ cup", n: "green olives" }, { a: "1 cup", n: "beef broth" }, { a: "1 pc", n: "onion" }, { a: "4 cloves", n: "garlic" }],
    steps: ["Sauté garlic and onion. Add beef and brown on all sides.", "Pour in tomato sauce and broth. Bring to a boil, then simmer 45 minutes.", "Add potatoes and carrots; cook 15 minutes until tender.", "Stir in liver spread and olives. Simmer 10 more minutes.", "Add bell peppers in the last 5 minutes.", "Season with salt and pepper. Serve with rice."],
    nutrition: { calories: 385, protein: 28, carbs: 22, fat: 22, fiber: 3.5, sugar: 6, sodium: 720, cholesterol: 95, saturatedFat: 8, potassium: 680, calcium: 45, iron: 4.2 }
  },

  {
    id: "ph010", name: "Mechado", category: "Main Dish", region: "Nationwide", emoji: "🥩", cookTime: 100, servings: 6,
    desc: "Braised beef larded with pork fat in tomato sauce with potatoes and carrots.",
    ingredients: [{ a: "1 kg", n: "beef round or chuck" }, { a: "100g", n: "pork fat strips for larding" }, { a: "1 can", n: "tomato sauce" }, { a: "2 pcs", n: "potatoes, quartered" }, { a: "2 pcs", n: "carrots, sliced" }, { a: "¼ cup", n: "soy sauce" }, { a: "¼ cup", n: "vinegar" }, { a: "3 pcs", n: "bay leaves" }, { a: "1 pc", n: "onion" }, { a: "4 cloves", n: "garlic" }],
    steps: ["Lard the beef with pork fat strips using a skewer.", "Marinate beef in soy sauce and vinegar for 1 hour.", "Brown the beef in oil on all sides. Remove and set aside.", "Sauté garlic and onion. Add tomato sauce and bay leaves.", "Return beef, add enough water to cover. Simmer 1 hour until tender.", "Add potatoes and carrots, cook until soft.", "Slice beef and serve with sauce over rice."],
    nutrition: { calories: 340, protein: 26, carbs: 20, fat: 18, fiber: 3, sugar: 5, sodium: 680, cholesterol: 82, saturatedFat: 6.5, potassium: 620, calcium: 38, iron: 3.8 }
  },

  {
    id: "ph011", name: "Chicken Afritada", category: "Main Dish", region: "Nationwide", emoji: "🍗", cookTime: 50, servings: 5,
    desc: "Chicken simmered in tomato sauce with potatoes, carrots, and bell peppers — simple Filipino home cooking.",
    ingredients: [{ a: "1 kg", n: "chicken, cut into pieces" }, { a: "1 can", n: "tomato sauce (200ml)" }, { a: "2 pcs", n: "potatoes, cubed" }, { a: "2 pcs", n: "carrots, sliced" }, { a: "1 pc", n: "green bell pepper, sliced" }, { a: "1 pc", n: "red bell pepper, sliced" }, { a: "1 pc", n: "onion, diced" }, { a: "4 cloves", n: "garlic, minced" }, { a: "2 tbsp", n: "fish sauce" }],
    steps: ["Sauté garlic and onion in oil until fragrant.", "Add chicken and cook until lightly browned.", "Pour in tomato sauce and 1 cup water. Bring to a boil.", "Add fish sauce, potatoes, and carrots. Simmer 25 minutes.", "Add bell peppers and cook 5 more minutes.", "Adjust seasoning. Serve hot."],
    nutrition: { calories: 295, protein: 28, carbs: 20, fat: 12, fiber: 3, sugar: 6, sodium: 620, cholesterol: 85, saturatedFat: 3, potassium: 620, calcium: 42, iron: 2.5 }
  },

  {
    id: "ph012", name: "Pork Menudo", category: "Main Dish", region: "Nationwide", emoji: "🍖", cookTime: 50, servings: 5,
    desc: "Pork and liver cubes with potatoes, carrots, tomato sauce, and raisins for a sweet-savory finish.",
    ingredients: [{ a: "500g", n: "pork, cubed" }, { a: "150g", n: "pork liver, cubed" }, { a: "2 pcs", n: "potatoes, diced" }, { a: "2 pcs", n: "carrots, diced" }, { a: "1 can", n: "tomato sauce" }, { a: "2 tbsp", n: "raisins" }, { a: "2 tbsp", n: "soy sauce" }, { a: "1 pc", n: "onion" }, { a: "3 cloves", n: "garlic" }, { a: "1 pc", n: "red bell pepper" }],
    steps: ["Marinate pork and liver in soy sauce for 15 minutes.", "Sauté garlic and onion. Add pork; cook until lightly browned.", "Add tomato sauce, potatoes, and carrots with ½ cup water.", "Simmer covered for 20 minutes until pork is tender.", "Add liver, raisins, and bell pepper. Cook 8 more minutes.", "Season to taste and serve."],
    nutrition: { calories: 295, protein: 22, carbs: 25, fat: 14, fiber: 2.8, sugar: 8, sodium: 640, cholesterol: 185, saturatedFat: 4.5, potassium: 540, calcium: 32, iron: 5.2 }
  },

  {
    id: "ph013", name: "Dinuguan", category: "Main Dish", region: "Nationwide", emoji: "🍲", cookTime: 55, servings: 5,
    desc: "Savory pork blood stew cooked with vinegar, garlic, and chili — known as 'chocolate meat'.",
    ingredients: [{ a: "500g", n: "pork (belly and innards)" }, { a: "2 cups", n: "fresh pork blood" }, { a: "½ cup", n: "white vinegar" }, { a: "1 head", n: "garlic, minced" }, { a: "2 pcs", n: "finger chili" }, { a: "1 pc", n: "onion" }, { a: "3 tbsp", n: "fish sauce" }, { a: "Oil", n: "for sautéing" }],
    steps: ["Sauté garlic and onion in oil. Add pork and cook until browned.", "Pour in vinegar. Do not stir. Let boil then simmer 15 minutes.", "Slowly add pork blood while stirring continuously.", "Add fish sauce and chili. Simmer 15–20 minutes until sauce thickens.", "Stir occasionally to prevent lumps. Adjust seasoning.", "Serve with puto or rice."],
    nutrition: { calories: 350, protein: 25, carbs: 8, fat: 24, fiber: 0.5, sugar: 1, sodium: 820, cholesterol: 120, saturatedFat: 8, potassium: 380, calcium: 18, iron: 8.5 }
  },

  {
    id: "ph014", name: "Laing", category: "Vegetable Dish", region: "Bicol", emoji: "🌿", cookTime: 60, servings: 5,
    desc: "Dried taro leaves simmered in coconut milk with pork and fiery siling labuyo — iconic Bicolano dish.",
    ingredients: [{ a: "200g", n: "dried taro leaves" }, { a: "2 cans", n: "coconut milk" }, { a: "200g", n: "pork, sliced" }, { a: "5–10 pcs", n: "siling labuyo (bird's eye chili)" }, { a: "2 tbsp", n: "shrimp paste (bagoong)" }, { a: "1 thumb", n: "ginger, julienned" }, { a: "4 cloves", n: "garlic" }, { a: "1 pc", n: "onion" }],
    steps: ["Combine dried taro leaves and 1 can coconut milk in a pot. Do not stir.", "Bring to a boil uncovered, then add pork, garlic, onion, and ginger.", "Add the second can of coconut milk and bagoong. Add chilies.", "Simmer uncovered 30–40 minutes, stirring only after the first 20 minutes.", "Cook until oil separates and sauce thickens. The leaves will have softened completely.", "Taste and adjust salt. Serve with rice."],
    nutrition: { calories: 380, protein: 14, carbs: 16, fat: 30, fiber: 5.5, sugar: 3, sodium: 680, cholesterol: 42, saturatedFat: 22, potassium: 620, calcium: 120, iron: 3.8 }
  },

  {
    id: "ph015", name: "Bicol Express", category: "Main Dish", region: "Bicol", emoji: "🌶️", cookTime: 50, servings: 5,
    desc: "Pork cooked in creamy coconut milk with an abundance of chili peppers — fiery Bicolano classic.",
    ingredients: [{ a: "500g", n: "pork belly, cubed" }, { a: "1 can", n: "coconut milk" }, { a: "15–20 pcs", n: "siling labuyo (bird's eye chili)" }, { a: "5 pcs", n: "long green chili (siling haba)" }, { a: "2 tbsp", n: "shrimp paste" }, { a: "4 cloves", n: "garlic" }, { a: "1 pc", n: "onion" }, { a: "1 thumb", n: "ginger" }],
    steps: ["Sauté garlic, onion, and ginger in oil.", "Add pork and cook until lightly browned.", "Add shrimp paste and cook 2 minutes.", "Pour in coconut milk and add all chilies.", "Simmer uncovered 25–30 minutes, stirring occasionally, until sauce thickens.", "Season to taste. Serve with lots of rice — it's very spicy!"],
    nutrition: { calories: 420, protein: 20, carbs: 8, fat: 34, fiber: 2, sugar: 2, sodium: 720, cholesterol: 85, saturatedFat: 24, potassium: 420, calcium: 38, iron: 2.2 }
  },

  {
    id: "ph016", name: "Sisig", category: "Main Dish", region: "Pampanga", emoji: "🍳", cookTime: 120, servings: 4,
    desc: "Sizzling chopped pork face and ears with calamansi, chili, and onion — the Kapampangan masterpiece.",
    ingredients: [{ a: "500g", n: "pork face and ears" }, { a: "3 pcs", n: "calamansi, juiced" }, { a: "3 pcs", n: "finger chili, minced" }, { a: "2 pcs", n: "large onions, minced" }, { a: "3 tbsp", n: "mayonnaise" }, { a: "1 tbsp", n: "soy sauce" }, { a: "Salt and pepper", n: "to taste" }, { a: "1 pc", n: "egg (optional)" }],
    steps: ["Boil pork face and ears in seasoned water for 45 minutes until tender.", "Grill or fry until charred and crispy. Chop finely.", "Mix chopped pork with onion, chili, calamansi juice, soy sauce, and mayonnaise.", "Heat a cast-iron sizzling plate until very hot.", "Place the sisig on the hot plate and let it sizzle.", "Optionally crack an egg on top and mix before eating. Serve immediately."],
    nutrition: { calories: 480, protein: 28, carbs: 5, fat: 38, fiber: 0.8, sugar: 2, sodium: 780, cholesterol: 220, saturatedFat: 12, potassium: 360, calcium: 30, iron: 2.4 }
  },

  {
    id: "ph017", name: "Pinakbet", category: "Vegetable Dish", region: "Ilocos", emoji: "🥬", cookTime: 30, servings: 4,
    desc: "Mixed vegetables with shrimp paste and pork — the quintessential Ilocano vegetable dish.",
    ingredients: [{ a: "1 pc", n: "ampalaya (bitter melon), sliced" }, { a: "100g", n: "sitaw (string beans)" }, { a: "1 pc", n: "kalabasa, diced" }, { a: "2 pcs", n: "okra" }, { a: "1 pc", n: "eggplant, sliced" }, { a: "150g", n: "pork belly slices" }, { a: "3 tbsp", n: "bagoong isda (fermented fish)" }, { a: "2 pcs", n: "tomatoes" }, { a: "3 cloves", n: "garlic" }, { a: "1 pc", n: "onion" }],
    steps: ["Sauté garlic, onion, and tomatoes in oil until softened.", "Add pork and cook until lightly browned.", "Add bagoong isda and cook 2 minutes.", "Layer vegetables: kalabasa first, then okra, eggplant, sitaw, and ampalaya.", "Add ¼ cup water, cover, and cook on medium heat 10–15 minutes.", "Do not over-stir to keep vegetables intact. Serve with rice."],
    nutrition: { calories: 195, protein: 12, carbs: 20, fat: 8, fiber: 6.5, sugar: 6, sodium: 820, cholesterol: 32, saturatedFat: 2.5, potassium: 720, calcium: 82, iron: 2.5 }
  },

  {
    id: "ph018", name: "Nilaga", category: "Main Dish", region: "Nationwide", emoji: "🍲", cookTime: 80, servings: 6,
    desc: "Simple boiled beef or pork soup with potatoes, cabbage, bok choy, and corn.",
    ingredients: [{ a: "1 kg", n: "beef or pork with bones" }, { a: "2 pcs", n: "potatoes, quartered" }, { a: "1 pc", n: "corn, cut into rounds" }, { a: "¼ head", n: "cabbage, wedged" }, { a: "1 bunch", n: "bok choy" }, { a: "1 tsp", n: "black peppercorns" }, { a: "1 pc", n: "onion" }, { a: "3 tbsp", n: "fish sauce" }, { a: "8 cups", n: "water" }],
    steps: ["Boil water. Add meat, onion, and peppercorns. Skim foam.", "Reduce heat and simmer 45–60 minutes until meat is tender.", "Add potatoes and corn. Cook 15 minutes.", "Add cabbage and bok choy. Cook 5 more minutes.", "Season with fish sauce to taste.", "Serve piping hot — great for cold or rainy days."],
    nutrition: { calories: 260, protein: 24, carbs: 18, fat: 10, fiber: 4, sugar: 5, sodium: 490, cholesterol: 70, saturatedFat: 3.5, potassium: 680, calcium: 58, iron: 2.8 }
  },

  {
    id: "ph019", name: "Chicken Inasal", category: "Main Dish", region: "Bacolod", emoji: "🍗", cookTime: 50, servings: 4,
    desc: "Bacolod-style grilled chicken marinated in vinegar, calamansi, lemongrass, and annatto oil.",
    ingredients: [{ a: "1 kg", n: "chicken, cut into pieces" }, { a: "¼ cup", n: "vinegar" }, { a: "3 tbsp", n: "calamansi juice" }, { a: "2 stalks", n: "lemongrass, bruised" }, { a: "3 tbsp", n: "annatto oil (asuete)" }, { a: "4 cloves", n: "garlic, minced" }, { a: "1 thumb", n: "ginger, grated" }, { a: "1 tbsp", n: "sugar" }, { a: "Salt and pepper", n: "to taste" }],
    steps: ["Combine vinegar, calamansi, garlic, ginger, sugar, salt, and pepper.", "Add lemongrass and annatto oil to the marinade.", "Marinate chicken for at least 2 hours (overnight preferred).", "Grill over charcoal on medium heat, basting with annatto oil every few minutes.", "Cook each side 15–20 minutes until cooked through and nicely charred.", "Serve with garlic rice and spiced vinegar."],
    nutrition: { calories: 280, protein: 32, carbs: 5, fat: 14, fiber: 0.3, sugar: 3, sodium: 580, cholesterol: 95, saturatedFat: 3.5, potassium: 420, calcium: 25, iron: 1.8 }
  },

  {
    id: "ph020", name: "Bulalo", category: "Main Dish", region: "Batangas", emoji: "🦴", cookTime: 240, servings: 5,
    desc: "Beef shank and bone marrow slow-simmered for hours with corn, cabbage, and vegetables.",
    ingredients: [{ a: "1.5 kg", n: "beef shank with bone" }, { a: "2 pcs", n: "bone marrow pieces" }, { a: "2 pcs", n: "corn, cut into rounds" }, { a: "¼ head", n: "cabbage, wedged" }, { a: "2 pcs", n: "potatoes, halved" }, { a: "1 tsp", n: "whole peppercorns" }, { a: "1 pc", n: "onion" }, { a: "3 tbsp", n: "fish sauce" }, { a: "8 cups", n: "water" }],
    steps: ["In a large pot, boil beef shank and bone marrow in water. Skim foam thoroughly.", "Add onion and peppercorns. Reduce heat to low and simmer 2–3 hours.", "The broth should be rich and the marrow ready to slide out.", "Add corn and potatoes; cook 20 minutes.", "Add cabbage in the last 5 minutes. Season with fish sauce.", "Serve in a large bowl with dipping sauce of fish sauce and calamansi."],
    nutrition: { calories: 395, protein: 38, carbs: 14, fat: 22, fiber: 3, sugar: 4, sodium: 520, cholesterol: 95, saturatedFat: 9, potassium: 640, calcium: 48, iron: 3.8 }
  },

  // ── NOODLE DISHES ─────────────────────────────────────────
  {
    id: "ph021", name: "Pancit Canton", category: "Noodle Dish", region: "Nationwide", emoji: "🍜", cookTime: 25, servings: 4,
    desc: "Stir-fried wheat noodles with pork, shrimp, and vegetables — always served at birthdays for long life.",
    ingredients: [{ a: "250g", n: "canton noodles" }, { a: "150g", n: "pork, sliced" }, { a: "100g", n: "shrimp, peeled" }, { a: "1 cup", n: "cabbage, shredded" }, { a: "1 pc", n: "carrot, julienned" }, { a: "2 stalks", n: "celery, sliced" }, { a: "3 tbsp", n: "soy sauce" }, { a: "2 tbsp", n: "fish sauce" }, { a: "3 cloves", n: "garlic" }, { a: "1 pc", n: "onion" }, { a: "1 cup", n: "chicken broth" }],
    steps: ["Sauté garlic and onion. Add pork and cook until done. Add shrimp.", "Add vegetables: carrot, celery, cabbage. Toss quickly.", "Pour in broth, soy sauce, and fish sauce. Bring to a boil.", "Add noodles and toss to coat, adding more broth if needed.", "Cook 3–4 minutes until noodles are tender but still have bite.", "Garnish with calamansi, fried garlic, and green onion."],
    nutrition: { calories: 345, protein: 22, carbs: 42, fat: 10, fiber: 3.5, sugar: 3, sodium: 820, cholesterol: 85, saturatedFat: 2.8, potassium: 480, calcium: 52, iron: 2.5 }
  },

  {
    id: "ph022", name: "Pancit Bihon", category: "Noodle Dish", region: "Nationwide", emoji: "🍜", cookTime: 20, servings: 4,
    desc: "Thin rice noodles stir-fried with vegetables, pork, and shrimp — lighter than canton.",
    ingredients: [{ a: "200g", n: "bihon (rice noodles), soaked" }, { a: "150g", n: "pork, sliced" }, { a: "100g", n: "shrimp" }, { a: "1 cup", n: "cabbage, shredded" }, { a: "1 pc", n: "carrot, julienned" }, { a: "3 tbsp", n: "soy sauce" }, { a: "2 tbsp", n: "oyster sauce" }, { a: "3 cloves", n: "garlic" }, { a: "1 cup", n: "broth" }],
    steps: ["Sauté garlic. Add pork and shrimp; cook through.", "Add cabbage and carrot; toss 2 minutes.", "Pour in broth, soy sauce, and oyster sauce.", "Add soaked bihon and toss well.", "Cook until noodles absorb the liquid, about 4–5 minutes.", "Serve with calamansi wedges."],
    nutrition: { calories: 295, protein: 18, carbs: 44, fat: 6, fiber: 3, sugar: 3, sodium: 760, cholesterol: 72, saturatedFat: 2, potassium: 420, calcium: 48, iron: 2.2 }
  },

  {
    id: "ph023", name: "Palabok", category: "Noodle Dish", region: "Nationwide", emoji: "🍜", cookTime: 40, servings: 5,
    desc: "Rice noodles smothered in shrimp-annatto sauce, topped with chicharon, hard-boiled egg, and green onion.",
    ingredients: [{ a: "200g", n: "bihon noodles, cooked" }, { a: "200g", n: "shrimp, ground or whole" }, { a: "2 tbsp", n: "annatto powder" }, { a: "3 tbsp", n: "flour" }, { a: "2 cups", n: "shrimp broth" }, { a: "50g", n: "chicharon, crushed" }, { a: "2 pcs", n: "hard-boiled eggs, sliced" }, { a: "3 tbsp", n: "fish sauce" }, { a: "Green onion", n: "for garnish" }],
    steps: ["Make sauce: sauté garlic, add shrimp broth mixed with annatto and flour.", "Stir constantly until thick. Season with fish sauce.", "Add ground shrimp and cook 3 minutes.", "Place cooked noodles on a platter. Pour hot sauce over.", "Top with sliced eggs, crushed chicharon, and green onion.", "Serve with calamansi on the side."],
    nutrition: { calories: 380, protein: 20, carbs: 52, fat: 12, fiber: 2, sugar: 2, sodium: 880, cholesterol: 140, saturatedFat: 3.5, potassium: 360, calcium: 65, iron: 2.8 }
  },

  {
    id: "ph024", name: "Sopas", category: "Noodle Dish", region: "Nationwide", emoji: "🍜", cookTime: 35, servings: 6,
    desc: "Creamy Filipino macaroni soup with chicken, evaporated milk, carrots, and celery.",
    ingredients: [{ a: "2 cups", n: "elbow macaroni" }, { a: "400g", n: "chicken breast, diced" }, { a: "1 can", n: "evaporated milk (370ml)" }, { a: "2 pcs", n: "carrots, diced" }, { a: "3 stalks", n: "celery, sliced" }, { a: "1 pc", n: "onion" }, { a: "3 cloves", n: "garlic" }, { a: "6 cups", n: "chicken broth" }, { a: "2 tbsp", n: "fish sauce" }],
    steps: ["Sauté garlic and onion. Add chicken and cook through.", "Pour in broth and bring to a boil.", "Add macaroni and cook 8 minutes.", "Add carrots and celery; cook 5 more minutes.", "Reduce heat and stir in evaporated milk. Season with fish sauce.", "Simmer gently (do not boil after adding milk). Serve hot."],
    nutrition: { calories: 285, protein: 20, carbs: 32, fat: 8, fiber: 2, sugar: 5, sodium: 560, cholesterol: 52, saturatedFat: 3, potassium: 380, calcium: 120, iron: 1.8 }
  },

  // ── RICE DISHES ───────────────────────────────────────────
  {
    id: "ph025", name: "Sinangag", category: "Rice Dish", region: "Nationwide", emoji: "🍚", cookTime: 10, servings: 2,
    desc: "Filipino garlic fried rice — day-old rice stir-fried with loads of golden crispy garlic.",
    ingredients: [{ a: "3 cups", n: "day-old cooked rice" }, { a: "1 head", n: "garlic, minced" }, { a: "3 tbsp", n: "cooking oil" }, { a: "½ tsp", n: "salt" }, { a: "¼ tsp", n: "pepper" }],
    steps: ["Heat oil in a wok over medium-high heat.", "Add garlic and fry until golden and fragrant, about 2–3 minutes.", "Add cold rice and break up any clumps with a spatula.", "Stir-fry on high heat for 4–5 minutes, mixing the garlic through.", "Season with salt and pepper.", "Serve as breakfast base with eggs, tapa, or longganisa."],
    nutrition: { calories: 260, protein: 5, carbs: 52, fat: 5, fiber: 0.8, sugar: 0.2, sodium: 320, cholesterol: 0, saturatedFat: 0.8, potassium: 80, calcium: 18, iron: 1.2 }
  },

  {
    id: "ph026", name: "Arroz Caldo", category: "Rice Dish", region: "Nationwide", emoji: "🍚", cookTime: 45, servings: 4,
    desc: "Creamy Filipino congee with chicken, ginger, and kasubha, garnished with fried garlic and egg.",
    ingredients: [{ a: "1 cup", n: "malagkit (glutinous) or regular rice" }, { a: "300g", n: "chicken, shredded" }, { a: "1 thumb", n: "ginger, julienned" }, { a: "4 cloves", n: "garlic, minced" }, { a: "1 pc", n: "onion" }, { a: "5 cups", n: "chicken broth" }, { a: "2 tbsp", n: "fish sauce" }, { a: "2 pcs", n: "hard-boiled eggs" }, { a: "Fried garlic & green onion", n: "for topping" }],
    steps: ["Sauté garlic until golden, reserve half for topping. In same oil, sauté onion and ginger.", "Add chicken and cook until opaque.", "Add rice and stir to coat. Pour in broth.", "Bring to a boil, then simmer 25–30 minutes stirring occasionally until porridge-thick.", "Season with fish sauce. Adjust water/broth for desired consistency.", "Serve topped with hard-boiled egg, fried garlic, green onion, and calamansi."],
    nutrition: { calories: 285, protein: 18, carbs: 38, fat: 7, fiber: 1.2, sugar: 1, sodium: 620, cholesterol: 122, saturatedFat: 2, potassium: 320, calcium: 42, iron: 1.8 }
  },

  {
    id: "ph027", name: "Goto", category: "Rice Dish", region: "Nationwide", emoji: "🍚", cookTime: 120, servings: 4,
    desc: "Rice porridge with beef tripe, seasoned with ginger and topped with crispy fried garlic.",
    ingredients: [{ a: "300g", n: "beef tripe, cleaned and boiled" }, { a: "1 cup", n: "rice" }, { a: "1 thumb", n: "ginger, sliced" }, { a: "4 cloves", n: "garlic, minced" }, { a: "1 pc", n: "onion" }, { a: "5 cups", n: "water or beef broth" }, { a: "2 tbsp", n: "fish sauce" }, { a: "2 pcs", n: "hard-boiled eggs" }, { a: "Green onion", n: "to garnish" }],
    steps: ["Boil tripe for 1 hour until tender. Drain and slice thin.", "Sauté garlic (save some for topping) and onion. Add ginger.", "Add rice and stir. Pour in broth; bring to a boil.", "Stir in sliced tripe. Simmer 30 minutes until rice breaks down into porridge.", "Season with fish sauce.", "Top with egg, fried garlic, and green onion. Serve hot."],
    nutrition: { calories: 265, protein: 20, carbs: 36, fat: 5, fiber: 1, sugar: 0.8, sodium: 640, cholesterol: 105, saturatedFat: 1.8, potassium: 280, calcium: 38, iron: 2.2 }
  },

  // ── STREET FOOD ───────────────────────────────────────────
  {
    id: "ph028", name: "Lumpia Shanghai", category: "Street Food", region: "Nationwide", emoji: "🥟", cookTime: 40, servings: 6,
    desc: "Crispy Filipino spring rolls filled with ground pork, carrots, and onions — the ultimate party food.",
    ingredients: [{ a: "300g", n: "ground pork" }, { a: "1 pc", n: "carrot, grated" }, { a: "1 pc", n: "onion, minced" }, { a: "3 cloves", n: "garlic, minced" }, { a: "1 pc", n: "egg" }, { a: "2 tbsp", n: "soy sauce" }, { a: "Salt and pepper", n: "to taste" }, { a: "20 pcs", n: "spring roll wrappers" }, { a: "Oil", n: "for frying" }],
    steps: ["Mix pork, carrot, onion, garlic, egg, soy sauce, salt, and pepper.", "Lay a wrapper diagonally. Place 1 tablespoon filling at one corner.", "Roll tightly, folding in sides. Seal with a dab of water.", "Repeat with remaining filling.", "Deep fry in hot oil at 170°C for 4–5 minutes until golden brown.", "Drain on paper towels. Serve with sweet chili sauce."],
    nutrition: { calories: 285, protein: 16, carbs: 24, fat: 14, fiber: 1.5, sugar: 2, sodium: 520, cholesterol: 68, saturatedFat: 4.5, potassium: 280, calcium: 30, iron: 1.8 }
  },

  {
    id: "ph029", name: "Tokwa't Baboy", category: "Street Food", region: "Nationwide", emoji: "🍢", cookTime: 30, servings: 3,
    desc: "Crispy fried tofu and boiled pork ear tossed in spiced soy-vinegar dressing with onion.",
    ingredients: [{ a: "300g", n: "firm tofu, cubed" }, { a: "200g", n: "pork ear, boiled and sliced" }, { a: "¼ cup", n: "vinegar" }, { a: "¼ cup", n: "soy sauce" }, { a: "1 pc", n: "onion, diced" }, { a: "2 pcs", n: "red chili, minced" }, { a: "3 cloves", n: "garlic, minced" }, { a: "1 tsp", n: "sugar" }, { a: "Oil", n: "for frying" }],
    steps: ["Deep fry tofu cubes in hot oil until golden and crispy. Drain.", "Boil pork ear until very tender. Slice thin.", "Mix vinegar, soy sauce, garlic, chili, and sugar for dressing.", "Combine tofu and pork ear in a bowl.", "Pour dressing over and top with diced onion.", "Toss gently and serve."],
    nutrition: { calories: 255, protein: 20, carbs: 8, fat: 16, fiber: 1.5, sugar: 2, sodium: 760, cholesterol: 55, saturatedFat: 4, potassium: 320, calcium: 180, iron: 3.5 }
  },

  {
    id: "ph030", name: "Isaw", category: "Street Food", region: "Nationwide", emoji: "🍢", cookTime: 30, servings: 2,
    desc: "Grilled chicken intestine skewers — a beloved aromatic Filipino street barbecue staple.",
    ingredients: [{ a: "500g", n: "cleaned chicken intestines" }, { a: "¼ cup", n: "soy sauce" }, { a: "3 tbsp", n: "vinegar" }, { a: "4 cloves", n: "garlic, minced" }, { a: "2 tbsp", n: "brown sugar" }, { a: "½ tsp", n: "black pepper" }, { a: "Bamboo skewers", n: "soaked in water" }],
    steps: ["Boil intestines until tender. Drain and cool.", "Marinate in soy sauce, vinegar, garlic, sugar, and pepper for 1 hour.", "Thread onto skewers, folding the intestines accordion-style.", "Grill over hot charcoal, basting with marinade.", "Cook 8–10 minutes per side until nicely charred and caramelized.", "Serve with spiced vinegar dipping sauce."],
    nutrition: { calories: 175, protein: 15, carbs: 8, fat: 10, fiber: 0, sugar: 3, sodium: 560, cholesterol: 180, saturatedFat: 3, potassium: 220, calcium: 18, iron: 2.8 }
  },

  {
    id: "ph031", name: "Kwek-Kwek", category: "Street Food", region: "Nationwide", emoji: "🍡", cookTime: 15, servings: 4,
    desc: "Hard-boiled quail eggs coated in vibrant orange annatto batter and deep fried.",
    ingredients: [{ a: "24 pcs", n: "hard-boiled quail eggs, peeled" }, { a: "1 cup", n: "all-purpose flour" }, { a: "½ cup", n: "water" }, { a: "2 tsp", n: "annatto powder" }, { a: "½ tsp", n: "salt" }, { a: "Oil", n: "for deep frying" }],
    steps: ["Mix flour, annatto powder, salt, and water to form a smooth batter.", "Dip each quail egg into the orange batter, coating completely.", "Deep fry in hot oil at 175°C for 2–3 minutes until crisp.", "Work in batches and do not overcrowd the pan.", "Drain on paper towels.", "Serve hot with sweet chili sauce or spiced vinegar."],
    nutrition: { calories: 195, protein: 10, carbs: 18, fat: 10, fiber: 0.5, sugar: 0.5, sodium: 280, cholesterol: 220, saturatedFat: 2.5, potassium: 120, calcium: 45, iron: 2.2 }
  },

  {
    id: "ph032", name: "Fishball", category: "Street Food", region: "Nationwide", emoji: "🍢", cookTime: 10, servings: 2,
    desc: "Popular fish balls on skewers served with sweet-and-spicy or soy vinegar sauce.",
    ingredients: [{ a: "20 pcs", n: "store-bought fish balls" }, { a: "¼ cup", n: "banana catsup" }, { a: "2 tbsp", n: "soy sauce" }, { a: "1 tbsp", n: "vinegar" }, { a: "1 tsp", n: "sugar" }, { a: "Chili flakes", n: "optional" }, { a: "Oil", n: "for frying" }],
    steps: ["Heat oil in a pan or deep fryer.", "Fry fish balls 3–4 minutes until lightly golden and puffed.", "For sweet sauce: mix banana catsup, a little water, sugar, and chili.", "For vinegar sauce: mix soy sauce, vinegar, garlic, and onion.", "Skewer fish balls and serve with both dipping sauces.", "Best eaten hot straight from the pan."],
    nutrition: { calories: 185, protein: 12, carbs: 22, fat: 6, fiber: 0.5, sugar: 8, sodium: 680, cholesterol: 35, saturatedFat: 1.5, potassium: 180, calcium: 25, iron: 0.8 }
  },

  // ── SEAFOOD ───────────────────────────────────────────────
  {
    id: "ph033", name: "Kinilaw na Isda", category: "Seafood", region: "Nationwide", emoji: "🐟", cookTime: 15, servings: 3,
    desc: "Filipino ceviche — fresh raw fish cured in vinegar and calamansi with ginger and chili.",
    ingredients: [{ a: "400g", n: "very fresh tuna or tanigue, cubed" }, { a: "½ cup", n: "coconut vinegar" }, { a: "4 pcs", n: "calamansi, juiced" }, { a: "2 thumbs", n: "ginger, julienned" }, { a: "1 pc", n: "onion, sliced thin" }, { a: "2 pcs", n: "red chili, sliced" }, { a: "Salt", n: "to taste" }, { a: "3 tbsp", n: "coconut milk (optional)" }],
    steps: ["Place fish cubes in a bowl. Add vinegar and calamansi juice.", "Toss and let cure for 5–10 minutes — the acid will turn the fish opaque.", "Drain off most of the souring liquid.", "Add ginger, onion, chili, and coconut milk if using.", "Toss gently and season with salt.", "Serve immediately as appetizer."],
    nutrition: { calories: 165, protein: 24, carbs: 5, fat: 5, fiber: 0.5, sugar: 2, sodium: 420, cholesterol: 45, saturatedFat: 1, potassium: 480, calcium: 35, iron: 1.5 }
  },

  {
    id: "ph034", name: "Inihaw na Bangus", category: "Seafood", region: "Nationwide", emoji: "🐟", cookTime: 35, servings: 3,
    desc: "Whole stuffed milkfish grilled over charcoal — filled with tomatoes, onion, and ginger.",
    ingredients: [{ a: "1 pc", n: "whole bangus (milkfish), cleaned" }, { a: "2 pcs", n: "tomatoes, diced" }, { a: "1 pc", n: "onion, diced" }, { a: "1 thumb", n: "ginger, julienned" }, { a: "3 cloves", n: "garlic, minced" }, { a: "2 tbsp", n: "soy sauce" }, { a: "Salt and pepper", n: "to taste" }],
    steps: ["Score the fish on both sides and rub inside with salt.", "Mix tomatoes, onion, ginger, garlic, and soy sauce.", "Stuff the fish cavity with the mixture.", "Wrap the stuffed fish in foil or banana leaves.", "Grill over medium charcoal heat 15–20 minutes per side.", "Unwrap and serve with spiced vinegar and garlic rice."],
    nutrition: { calories: 235, protein: 30, carbs: 5, fat: 11, fiber: 1, sugar: 3, sodium: 420, cholesterol: 75, saturatedFat: 2.8, potassium: 520, calcium: 58, iron: 1.8 }
  },

  {
    id: "ph035", name: "Adobong Pusit", category: "Seafood", region: "Nationwide", emoji: "🦑", cookTime: 25, servings: 4,
    desc: "Squid cooked in its own ink with vinegar, soy sauce, and garlic — intensely savory.",
    ingredients: [{ a: "600g", n: "whole squid, cleaned (ink sacs reserved)" }, { a: "¼ cup", n: "vinegar" }, { a: "3 tbsp", n: "soy sauce" }, { a: "4 cloves", n: "garlic, minced" }, { a: "1 pc", n: "onion, sliced" }, { a: "2 pcs", n: "bay leaves" }, { a: "1 tsp", n: "whole peppercorns" }],
    steps: ["Clean squid, keeping ink sacs intact. Separate tentacles.", "In a pan, sauté garlic and onion.", "Add squid and cook 2 minutes.", "Pour in vinegar — do not stir. Let boil 1 minute.", "Add soy sauce, bay leaves, peppercorns, and squeeze in the ink sacs.", "Simmer uncovered 10–12 minutes until sauce thickens and squid is tender. Serve with rice."],
    nutrition: { calories: 195, protein: 22, carbs: 6, fat: 9, fiber: 0.3, sugar: 1, sodium: 780, cholesterol: 285, saturatedFat: 2, potassium: 380, calcium: 38, iron: 1.5 }
  },

  {
    id: "ph036", name: "Paksiw na Bangus", category: "Seafood", region: "Nationwide", emoji: "🐟", cookTime: 25, servings: 3,
    desc: "Milkfish braised in vinegar with ginger, garlic, and peppercorns — tangy and effortless.",
    ingredients: [{ a: "1 pc", n: "bangus, cut into serving pieces" }, { a: "½ cup", n: "white vinegar" }, { a: "1 thumb", n: "ginger, sliced" }, { a: "4 cloves", n: "garlic, crushed" }, { a: "1 tsp", n: "whole peppercorns" }, { a: "2 pcs", n: "finger chili" }, { a: "2 tbsp", n: "cooking oil" }, { a: "Salt", n: "to taste" }],
    steps: ["Arrange ginger and garlic in the bottom of a pan.", "Place fish pieces on top. Add vinegar, peppercorns, chili, and oil.", "Do not stir. Bring to a boil over medium heat.", "Reduce heat, cover, and simmer 15 minutes.", "Taste broth and season with salt.", "Serve hot with steamed rice."],
    nutrition: { calories: 220, protein: 28, carbs: 3, fat: 11, fiber: 0.3, sugar: 0.5, sodium: 520, cholesterol: 80, saturatedFat: 2.5, potassium: 440, calcium: 48, iron: 1.8 }
  },

  // ── VEGETABLES ────────────────────────────────────────────
  {
    id: "ph037", name: "Ginisang Ampalaya", category: "Vegetable Dish", region: "Nationwide", emoji: "🥬", cookTime: 15, servings: 3,
    desc: "Sautéed bitter melon with egg and garlic — a nutritional powerhouse and everyday Filipino dish.",
    ingredients: [{ a: "2 pcs", n: "ampalaya (bitter melon), sliced thin" }, { a: "3 pcs", n: "eggs, beaten" }, { a: "4 cloves", n: "garlic, minced" }, { a: "1 pc", n: "onion, sliced" }, { a: "2 pcs", n: "tomatoes, diced" }, { a: "2 tbsp", n: "fish sauce" }, { a: "Oil", n: "for sautéing" }],
    steps: ["Salt ampalaya slices, let sit 10 minutes, then squeeze out liquid to reduce bitterness.", "Heat oil, sauté garlic, onion, and tomatoes until softened.", "Add ampalaya and stir-fry 3–4 minutes until slightly tender.", "Pour in beaten eggs, scrambling with the ampalaya.", "Season with fish sauce. Cook until eggs are just set.", "Serve immediately with rice."],
    nutrition: { calories: 115, protein: 7, carbs: 8, fat: 6, fiber: 3.5, sugar: 2, sodium: 380, cholesterol: 130, saturatedFat: 1.5, potassium: 420, calcium: 45, iron: 1.8 }
  },

  {
    id: "ph038", name: "Ginataang Kalabasa", category: "Vegetable Dish", region: "Nationwide", emoji: "🎃", cookTime: 25, servings: 4,
    desc: "Squash and sitaw in coconut milk with shrimp — creamy and nourishing.",
    ingredients: [{ a: "500g", n: "kalabasa (butternut squash), cubed" }, { a: "150g", n: "sitaw (string beans)" }, { a: "200g", n: "shrimp, peeled" }, { a: "1 can", n: "coconut milk" }, { a: "3 cloves", n: "garlic" }, { a: "1 pc", n: "onion" }, { a: "2 pcs", n: "finger chili" }, { a: "2 tbsp", n: "fish sauce" }],
    steps: ["Sauté garlic and onion. Add shrimp and cook until pink. Remove shrimp.", "Add squash and sitaw to the pan.", "Pour in coconut milk and bring to a simmer.", "Cook 10–12 minutes until squash is fork-tender.", "Return shrimp. Add chili and fish sauce.", "Simmer 2 more minutes. Serve with rice."],
    nutrition: { calories: 255, protein: 12, carbs: 24, fat: 14, fiber: 4.5, sugar: 8, sodium: 480, cholesterol: 55, saturatedFat: 11, potassium: 680, calcium: 72, iron: 2 }
  },

  {
    id: "ph039", name: "Tortang Talong", category: "Vegetable Dish", region: "Nationwide", emoji: "🍆", cookTime: 20, servings: 2,
    desc: "Grilled eggplant omelette — charred eggplant flattened and pan-fried with beaten egg.",
    ingredients: [{ a: "2 pcs", n: "medium eggplant" }, { a: "3 pcs", n: "eggs, beaten" }, { a: "2 cloves", n: "garlic, minced" }, { a: "1 pc", n: "small onion, minced" }, { a: "Salt and pepper", n: "to taste" }, { a: "Oil", n: "for frying" }],
    steps: ["Grill or roast eggplant over open flame until charred. Peel skin off.", "Flatten peeled eggplant with a fork on a plate.", "Beat eggs with garlic, onion, salt, and pepper.", "Dip flattened eggplant into the egg mixture.", "Fry in oil over medium heat 3–4 minutes per side until golden.", "Serve with banana catsup or spiced vinegar."],
    nutrition: { calories: 145, protein: 8, carbs: 12, fat: 8, fiber: 4, sugar: 5, sodium: 280, cholesterol: 165, saturatedFat: 2, potassium: 380, calcium: 38, iron: 1.5 }
  },

  {
    id: "ph040", name: "Ginisang Monggo", category: "Vegetable Dish", region: "Nationwide", emoji: "🫘", cookTime: 50, servings: 5,
    desc: "Mung bean soup with garlic, onion, and pork — a cherished Filipino Friday tradition.",
    ingredients: [{ a: "1 cup", n: "green mung beans" }, { a: "150g", n: "pork belly, sliced" }, { a: "1 bunch", n: "ampalaya or spinach leaves" }, { a: "3 cloves", n: "garlic" }, { a: "1 pc", n: "onion" }, { a: "2 pcs", n: "tomatoes" }, { a: "2 tbsp", n: "fish sauce" }, { a: "5 cups", n: "water" }],
    steps: ["Boil mung beans in water until soft and some beans have burst, about 30 minutes.", "In another pan, sauté garlic, onion, and tomatoes.", "Add pork and cook until browned.", "Combine pork mixture with mung beans.", "Simmer 10 minutes. Add ampalaya or spinach leaves.", "Season with fish sauce. Serve hot."],
    nutrition: { calories: 245, protein: 16, carbs: 32, fat: 6, fiber: 9, sugar: 3, sodium: 540, cholesterol: 22, saturatedFat: 1.8, potassium: 620, calcium: 42, iron: 3.5 }
  },

  // ── BREAKFAST ─────────────────────────────────────────────
  {
    id: "ph041", name: "Tapsilog", category: "Breakfast", region: "Nationwide", emoji: "🍳", cookTime: 20, servings: 1,
    desc: "The beloved Filipino breakfast — beef tapa, sinangag (garlic rice), and fried itlog (egg).",
    ingredients: [{ a: "150g", n: "beef tapa (cured sliced beef)" }, { a: "1 cup", n: "sinangag (garlic fried rice)" }, { a: "2 pcs", n: "eggs, fried sunny side up" }, { a: "1 pc", n: "tomato, sliced" }, { a: "3 pcs", n: "calamansi" }, { a: "Spiced vinegar", n: "for dipping" }],
    steps: ["Fry beef tapa in a little oil over medium-high heat 2–3 minutes per side until caramelized.", "Prepare garlic rice: fry minced garlic until golden, add cold rice, season with salt.", "Fry eggs sunny side up.", "Plate rice, tapa, and eggs side by side.", "Garnish with tomato and calamansi.", "Serve with spiced vinegar for dipping the tapa."],
    nutrition: { calories: 580, protein: 32, carbs: 55, fat: 24, fiber: 1.5, sugar: 3, sodium: 920, cholesterol: 215, saturatedFat: 8, potassium: 420, calcium: 62, iron: 3.8 }
  },

  {
    id: "ph042", name: "Longsilog", category: "Breakfast", region: "Nationwide", emoji: "🌭", cookTime: 15, servings: 1,
    desc: "Filipino breakfast with sweet garlic longganisa sausage, garlic fried rice, and fried egg.",
    ingredients: [{ a: "3 pcs", n: "pork longganisa sausages" }, { a: "1 cup", n: "sinangag (garlic fried rice)" }, { a: "2 pcs", n: "eggs, fried" }, { a: "1 pc", n: "tomato, sliced" }, { a: "3 pcs", n: "calamansi" }, { a: "Vinegar dip", n: "" }],
    steps: ["Boil longganisa in ¼ cup water until liquid evaporates.", "Continue cooking in own fat until caramelized and skins blister.", "Prepare sinangag and fry eggs separately.", "Plate longganisa, rice, and eggs.", "Serve with sliced tomato, calamansi, and vinegar dip."],
    nutrition: { calories: 620, protein: 24, carbs: 56, fat: 34, fiber: 1.5, sugar: 6, sodium: 980, cholesterol: 235, saturatedFat: 12, potassium: 350, calcium: 58, iron: 2.8 }
  },

  {
    id: "ph043", name: "Bangsilog", category: "Breakfast", region: "Nationwide", emoji: "🐟", cookTime: 20, servings: 1,
    desc: "Boneless milkfish belly, garlic rice, and fried egg — one of the healthier silog meals.",
    ingredients: [{ a: "1 pc", n: "bangus belly, deboned" }, { a: "1 cup", n: "sinangag" }, { a: "2 pcs", n: "eggs, fried" }, { a: "2 pcs", n: "calamansi" }, { a: "Vinegar", n: "for dipping" }],
    steps: ["Season bangus with salt and pepper.", "Pan-fry in oil skin-side down for 4–5 minutes until crispy.", "Flip carefully and cook 3 more minutes.", "Prepare sinangag and fry eggs.", "Plate all components together.", "Serve with calamansi and vinegar."],
    nutrition: { calories: 520, protein: 35, carbs: 54, fat: 18, fiber: 1.2, sugar: 1.5, sodium: 680, cholesterol: 230, saturatedFat: 4.5, potassium: 480, calcium: 75, iron: 2.5 }
  },

  {
    id: "ph044", name: "Pan de Sal", category: "Breakfast", region: "Nationwide", emoji: "🍞", cookTime: 90, servings: 8,
    desc: "Soft, slightly sweet Filipino bread rolls with a crisp exterior — the quintessential Pinoy breakfast bread.",
    ingredients: [{ a: "3 cups", n: "all-purpose flour" }, { a: "1 pack", n: "instant yeast (7g)" }, { a: "3 tbsp", n: "white sugar" }, { a: "1 tsp", n: "salt" }, { a: "¼ cup", n: "vegetable oil" }, { a: "¾ cup", n: "warm water or milk" }, { a: "½ cup", n: "fine bread crumbs" }],
    steps: ["Mix flour, yeast, sugar, and salt. Add oil and warm water.", "Knead 8–10 minutes until smooth and elastic.", "Cover and let rise 1 hour until doubled.", "Punch down dough. Roll into logs and cut into 1.5-inch pieces.", "Roll each piece in bread crumbs and place on baking sheet.", "Let rise 30 more minutes. Bake at 375°F (190°C) for 18–20 minutes until golden."],
    nutrition: { calories: 145, protein: 4, carbs: 28, fat: 3, fiber: 1, sugar: 4, sodium: 180, cholesterol: 0, saturatedFat: 0.5, potassium: 65, calcium: 22, iron: 1.5 }
  },

  // ── DESSERTS ──────────────────────────────────────────────
  {
    id: "ph045", name: "Halo-Halo", category: "Dessert", region: "Nationwide", emoji: "🍨", cookTime: 20, servings: 1,
    desc: "The ultimate Filipino shaved ice dessert — layered with sweetened fruits, beans, ube, leche flan, and ice cream.",
    ingredients: [{ a: "2 cups", n: "finely shaved ice" }, { a: "¼ cup", n: "evaporated milk" }, { a: "2 tbsp", n: "ube halaya" }, { a: "1 slice", n: "leche flan" }, { a: "2 tbsp", n: "sweetened banana (minatamis na saging)" }, { a: "2 tbsp", n: "sweetened white beans" }, { a: "2 tbsp", n: "kaong (sugar palm)" }, { a: "2 tbsp", n: "nata de coco" }, { a: "1 tbsp", n: "pinipig" }, { a: "1 scoop", n: "ube or vanilla ice cream" }],
    steps: ["In a tall glass, layer sweetened ingredients: beans, banana, kaong, nata de coco.", "Pack shaved ice on top of the layers until the glass is mounded.", "Pour evaporated milk over the ice.", "Top with ube halaya, a slice of leche flan, and a scoop of ice cream.", "Sprinkle with pinipig.", "Mix everything together before eating."],
    nutrition: { calories: 365, protein: 6, carbs: 72, fat: 10, fiber: 3, sugar: 52, sodium: 140, cholesterol: 55, saturatedFat: 5, potassium: 280, calcium: 120, iron: 1.2 }
  },

  {
    id: "ph046", name: "Leche Flan", category: "Dessert", region: "Nationwide", emoji: "🍮", cookTime: 60, servings: 8,
    desc: "Silky rich caramel custard made with egg yolks and condensed milk — a fiesta classic.",
    ingredients: [{ a: "10 pcs", n: "egg yolks" }, { a: "1 can", n: "condensed milk (300ml)" }, { a: "1 can", n: "evaporated milk (370ml)" }, { a: "1 tsp", n: "vanilla extract" }, { a: "1 cup", n: "sugar (for caramel)" }],
    steps: ["Make caramel: melt sugar in llaneras (oval molds) over medium heat until amber. Set aside to cool.", "Beat egg yolks gently — do not create bubbles.", "Combine yolks with condensed milk, evaporated milk, and vanilla. Mix gently.", "Strain mixture through a fine sieve into caramel-lined molds.", "Cover with foil. Steam 30–35 minutes on very low heat until set.", "Cool completely, then refrigerate. Unmold by running a knife around the edge before inverting."],
    nutrition: { calories: 280, protein: 7, carbs: 42, fat: 9, fiber: 0, sugar: 40, sodium: 95, cholesterol: 185, saturatedFat: 4.5, potassium: 220, calcium: 165, iron: 0.8 }
  },

  {
    id: "ph047", name: "Ube Halaya", category: "Dessert", region: "Nationwide", emoji: "🟣", cookTime: 60, servings: 10,
    desc: "Creamy purple yam jam slow-cooked with condensed milk and butter — the flavor of Philippine fiestas.",
    ingredients: [{ a: "1 kg", n: "purple yam (ube), boiled and mashed" }, { a: "1 can", n: "condensed milk" }, { a: "1 can", n: "evaporated milk" }, { a: "¼ cup", n: "butter" }, { a: "½ cup", n: "sugar" }],
    steps: ["Boil ube until very tender. Peel and mash or grate finely.", "Combine mashed ube, condensed milk, evaporated milk, and sugar in a non-stick pan.", "Cook over medium-low heat, stirring continuously to prevent sticking.", "After 20 minutes, add butter and keep stirring.", "Cook another 20–25 minutes until mixture thickens and pulls away from the pan.", "Transfer to greased molds or container. Cool before serving."],
    nutrition: { calories: 220, protein: 3, carbs: 44, fat: 5, fiber: 2.5, sugar: 32, sodium: 65, cholesterol: 18, saturatedFat: 3, potassium: 380, calcium: 78, iron: 0.8 }
  },

  {
    id: "ph048", name: "Bibingka", category: "Dessert", region: "Nationwide", emoji: "🍰", cookTime: 35, servings: 8,
    desc: "Traditional Filipino rice cake baked in clay pots, topped with salted egg and kesong puti.",
    ingredients: [{ a: "2 cups", n: "rice flour" }, { a: "1 cup", n: "coconut milk" }, { a: "¾ cup", n: "sugar" }, { a: "3 pcs", n: "eggs" }, { a: "2 tsp", n: "baking powder" }, { a: "2 pcs", n: "salted eggs, sliced" }, { a: "100g", n: "kesong puti (white cheese)" }, { a: "2 tbsp", n: "butter" }],
    steps: ["Preheat oven to 375°F. Line clay pots or baking pans with banana leaves, brush with butter.", "Beat eggs and sugar until combined. Add coconut milk.", "Fold in rice flour and baking powder until smooth.", "Pour batter into prepared pans.", "Top with sliced salted egg and cheese.", "Bake 20–25 minutes until set and lightly golden. Brush top with butter while hot."],
    nutrition: { calories: 245, protein: 6, carbs: 36, fat: 9, fiber: 0.8, sugar: 18, sodium: 320, cholesterol: 88, saturatedFat: 5.5, potassium: 150, calcium: 85, iron: 1.2 }
  },

  {
    id: "ph049", name: "Puto", category: "Dessert", region: "Nationwide", emoji: "🧁", cookTime: 30, servings: 12,
    desc: "Fluffy steamed white rice muffins — eaten solo or paired with dinuguan.",
    ingredients: [{ a: "2 cups", n: "rice flour" }, { a: "1 cup", n: "sugar" }, { a: "2 tsp", n: "baking powder" }, { a: "¾ cup", n: "coconut milk" }, { a: "2 pcs", n: "eggs" }, { a: "Cheese or salted egg", n: "for topping (optional)" }],
    steps: ["Mix rice flour, sugar, and baking powder.", "Whisk eggs and coconut milk together. Combine with dry ingredients.", "Stir until smooth batter forms. Rest 10 minutes.", "Grease puto molds. Fill ¾ full.", "Steam over boiling water for 15–18 minutes until toothpick comes out clean.", "Top with a small slice of cheese or salted egg before removing from steamer."],
    nutrition: { calories: 115, protein: 2.5, carbs: 22, fat: 2.5, fiber: 0.5, sugar: 8, sodium: 85, cholesterol: 18, saturatedFat: 1.8, potassium: 65, calcium: 22, iron: 0.5 }
  },

  {
    id: "ph050", name: "Turon", category: "Dessert", region: "Nationwide", emoji: "🍌", cookTime: 20, servings: 4,
    desc: "Deep-fried banana spring rolls with jackfruit, rolled in caramelized brown sugar.",
    ingredients: [{ a: "4 pcs", n: "saba banana, halved lengthwise" }, { a: "½ cup", n: "langka (jackfruit), strips" }, { a: "8 pcs", n: "spring roll wrappers" }, { a: "½ cup", n: "brown sugar" }, { a: "Oil", n: "for frying" }],
    steps: ["Lay a wrapper diagonally. Place a banana half and some jackfruit in the center.", "Sprinkle with brown sugar. Roll tightly, folding in the sides. Seal with water.", "Roll the finished turon in brown sugar to coat the outside.", "Deep fry in medium-hot oil until golden brown and caramelized, about 3–4 minutes.", "The sugar coating should be glossy and caramelized.", "Drain and cool slightly before serving."],
    nutrition: { calories: 185, protein: 2, carbs: 36, fat: 5, fiber: 2, sugar: 18, sodium: 45, cholesterol: 0, saturatedFat: 1, potassium: 280, calcium: 12, iron: 0.6 }
  },

  {
    id: "ph051", name: "Biko", category: "Dessert", region: "Nationwide", emoji: "🍯", cookTime: 60, servings: 10,
    desc: "Sweet sticky rice cooked in coconut milk and brown sugar, topped with latik (coconut curds).",
    ingredients: [{ a: "2 cups", n: "glutinous rice (malagkit)" }, { a: "2 cans", n: "coconut milk" }, { a: "1½ cups", n: "brown sugar" }, { a: "½ tsp", n: "salt" }, { a: "Latik", n: "(coconut curds) for topping" }],
    steps: ["Cook glutinous rice with 1 can coconut milk and water until absorbed.", "In a separate pan, boil the second can of coconut milk with brown sugar.", "Stir until sugar dissolves and mixture thickens slightly.", "Add cooked rice to the coconut sugar mixture.", "Stir continuously over medium-low heat until mixture pulls away from pan sides.", "Transfer to a greased pan, smooth the top, and garnish with latik."],
    nutrition: { calories: 255, protein: 3, carbs: 50, fat: 6, fiber: 1, sugar: 24, sodium: 18, cholesterol: 0, saturatedFat: 5, potassium: 145, calcium: 18, iron: 1.2 }
  },

  {
    id: "ph052", name: "Palitaw", category: "Dessert", region: "Nationwide", emoji: "🟤", cookTime: 20, servings: 6,
    desc: "Flat rice cakes that float when cooked — topped with toasted sesame, sugar, and grated coconut.",
    ingredients: [{ a: "2 cups", n: "glutinous rice flour" }, { a: "¾ cup", n: "water" }, { a: "1 cup", n: "grated coconut" }, { a: "½ cup", n: "white sugar" }, { a: "2 tbsp", n: "toasted sesame seeds" }],
    steps: ["Mix rice flour and water to form a pliable dough.", "Pinch off golf ball-sized pieces and flatten into oval discs.", "Drop into a pot of boiling water.", "When they float to the surface (about 2–3 minutes), they're done.", "Remove with a slotted spoon and roll in grated coconut.", "Sprinkle with sesame seeds and sugar. Serve."],
    nutrition: { calories: 195, protein: 3, carbs: 38, fat: 5, fiber: 2, sugar: 12, sodium: 25, cholesterol: 0, saturatedFat: 3.5, potassium: 120, calcium: 28, iron: 1 }
  },

  // ── CONDIMENTS / SIDES ────────────────────────────────────
  {
    id: "ph053", name: "Atchara", category: "Side Dish", region: "Nationwide", emoji: "🥕", cookTime: 30, servings: 10,
    desc: "Sweet and tangy pickled unripe papaya with carrots, peppers, and raisins — the perfect palate cleanser.",
    ingredients: [{ a: "1 pc", n: "large green papaya, shredded" }, { a: "2 pcs", n: "carrots, shredded" }, { a: "1 pc", n: "red bell pepper, julienned" }, { a: "1 pc", n: "onion, thinly sliced" }, { a: "3 cloves", n: "garlic, minced" }, { a: "¼ cup", n: "raisins" }, { a: "1 cup", n: "vinegar" }, { a: "½ cup", n: "sugar" }, { a: "1 tsp", n: "salt" }],
    steps: ["Salt shredded papaya, let sit 30 minutes, then squeeze out liquid thoroughly.", "Combine vinegar, sugar, and salt in a saucepan. Simmer until sugar dissolves. Cool.", "Mix papaya, carrots, bell pepper, onion, and garlic.", "Pour cooled pickling liquid over vegetables.", "Add raisins and mix well.", "Pack into sterilized jars and refrigerate at least 24 hours before serving."],
    nutrition: { calories: 55, protein: 0.5, carbs: 14, fat: 0.2, fiber: 1.5, sugar: 12, sodium: 180, cholesterol: 0, saturatedFat: 0, potassium: 120, calcium: 18, iron: 0.4 }
  },

  {
    id: "ph054", name: "Bagoong Alamang", category: "Side Dish", region: "Nationwide", emoji: "🦐", cookTime: 15, servings: 8,
    desc: "Sautéed fermented shrimp paste — an essential Filipino condiment for kare-kare and green mango.",
    ingredients: [{ a: "1 cup", n: "raw bagoong alamang (fermented shrimp paste)" }, { a: "3 cloves", n: "garlic, minced" }, { a: "1 pc", n: "small onion, minced" }, { a: "2 tbsp", n: "sugar" }, { a: "2 tbsp", n: "cooking oil" }, { a: "1 pc", n: "red chili (optional)" }],
    steps: ["Heat oil in a pan. Sauté garlic and onion until softened.", "Add bagoong and stir well.", "Add sugar and chili if using.", "Cook over low heat for 8–10 minutes, stirring often.", "The color will deepen and the raw smell will mellow.", "Cool and store in a jar. Keeps refrigerated for weeks."],
    nutrition: { calories: 45, protein: 5.5, carbs: 2, fat: 1.5, fiber: 0, sugar: 0, sodium: 2400, cholesterol: 65, saturatedFat: 0.5, potassium: 85, calcium: 48, iron: 1.2 }
  },

  // ── MORE MAINS ────────────────────────────────────────────
  {
    id: "ph055", name: "Pork Humba", category: "Main Dish", region: "Visayas", emoji: "🍖", cookTime: 90, servings: 5,
    desc: "Visayan braised pork belly with fermented black beans, star anise, and brown sugar.",
    ingredients: [{ a: "1 kg", n: "pork belly, cut into chunks" }, { a: "¼ cup", n: "tausi (fermented black beans)" }, { a: "¼ cup", n: "vinegar" }, { a: "¼ cup", n: "soy sauce" }, { a: "3 tbsp", n: "brown sugar" }, { a: "2 pcs", n: "star anise" }, { a: "3 pcs", n: "bay leaves" }, { a: "1 head", n: "garlic" }, { a: "Water to cover", n: "" }],
    steps: ["Combine all ingredients in a pot.", "Bring to a boil, then reduce heat and simmer 1 hour until pork is very tender.", "Remove lid and cook until sauce thickens and caramelizes.", "The pork should be fall-apart tender and glistening.", "Serve with steamed rice. The sauce is the star — pour generously."],
    nutrition: { calories: 480, protein: 24, carbs: 14, fat: 36, fiber: 1, sugar: 8, sodium: 880, cholesterol: 115, saturatedFat: 13, potassium: 350, calcium: 25, iron: 2 }
  },

  {
    id: "ph056", name: "Crispy Pata", category: "Main Dish", region: "Nationwide", emoji: "🦵", cookTime: 180, servings: 6,
    desc: "Whole deep-fried pork knuckle — incredibly crispy skin with tender, juicy meat inside.",
    ingredients: [{ a: "1 pc", n: "whole pork knuckle (pata)" }, { a: "1 head", n: "garlic" }, { a: "1 tbsp", n: "whole peppercorns" }, { a: "3 pcs", n: "bay leaves" }, { a: "2 tbsp", n: "salt" }, { a: "Oil", n: "for deep frying" }, { a: "Soy-vinegar dip", n: "for serving" }],
    steps: ["Boil pork knuckle in seasoned water (garlic, pepper, bay, salt) for 1.5–2 hours until tender.", "Drain and pat completely dry. Air dry uncovered for at least 2 hours.", "Deep fry in very hot oil (190°C) for 15–20 minutes until skin is golden and blistered.", "Carefully ladle hot oil over the surface for even crisping.", "Rest 5 minutes before serving.", "Chop into pieces and serve with soy-vinegar-garlic dipping sauce."],
    nutrition: { calories: 580, protein: 38, carbs: 2, fat: 46, fiber: 0, sugar: 0, sodium: 620, cholesterol: 150, saturatedFat: 16, potassium: 380, calcium: 22, iron: 2.2 }
  },

  {
    id: "ph057", name: "Binagoongang Baboy", category: "Main Dish", region: "Nationwide", emoji: "🍖", cookTime: 35, servings: 4,
    desc: "Pork sautéed in bagoong alamang — pungent, salty, addictive, and best with green mango.",
    ingredients: [{ a: "500g", n: "pork belly, cubed" }, { a: "3 tbsp", n: "sautéed bagoong alamang" }, { a: "2 pcs", n: "tomatoes, diced" }, { a: "1 pc", n: "onion, diced" }, { a: "3 cloves", n: "garlic, minced" }, { a: "2 pcs", n: "finger chili" }, { a: "Green mango slices", n: "for serving" }],
    steps: ["Boil pork belly until tender. Drain and cut into cubes.", "Pan fry pork cubes until browned.", "Sauté garlic, onion, and tomatoes. Add the pork.", "Stir in bagoong and chili.", "Cook 10 minutes until flavors meld.", "Serve with steamed rice and green mango on the side."],
    nutrition: { calories: 390, protein: 22, carbs: 8, fat: 30, fiber: 1.5, sugar: 2, sodium: 1280, cholesterol: 100, saturatedFat: 10, potassium: 380, calcium: 35, iron: 1.8 }
  },

  {
    id: "ph058", name: "Tortang Giniling", category: "Main Dish", region: "Nationwide", emoji: "🍳", cookTime: 20, servings: 3,
    desc: "Ground pork omelette pan-fried until golden — quick, budget-friendly, and delicious.",
    ingredients: [{ a: "300g", n: "ground pork" }, { a: "3 pcs", n: "eggs, beaten" }, { a: "1 pc", n: "onion, minced" }, { a: "3 cloves", n: "garlic, minced" }, { a: "1 pc", n: "potato, diced small" }, { a: "1 pc", n: "carrot, diced small" }, { a: "2 tbsp", n: "soy sauce" }, { a: "Salt and pepper", n: "to taste" }],
    steps: ["Sauté garlic and onion. Add ground pork and cook through.", "Add potato and carrot; cook until soft. Season with soy sauce, salt, pepper.", "Cool mixture slightly then combine with beaten eggs.", "Heat oil in a pan. Pour in a portion of the egg-meat mixture.", "Cook on medium-low heat 4 minutes until bottom is set.", "Flip and cook other side until golden. Serve with rice."],
    nutrition: { calories: 265, protein: 20, carbs: 14, fat: 15, fiber: 1.5, sugar: 2, sodium: 420, cholesterol: 215, saturatedFat: 5, potassium: 380, calcium: 42, iron: 2.2 }
  },

  {
    id: "ph059", name: "Embutido", category: "Main Dish", region: "Nationwide", emoji: "🥩", cookTime: 80, servings: 8,
    desc: "Filipino meat loaf roll stuffed with hard-boiled egg, raisins, and sausage — steamed then pan-fried.",
    ingredients: [{ a: "500g", n: "ground pork" }, { a: "2 pcs", n: "hard-boiled eggs" }, { a: "2 pcs", n: "Vienna sausages, sliced" }, { a: "2 tbsp", n: "raisins" }, { a: "½ cup", n: "grated cheese" }, { a: "1 pc", n: "red bell pepper, minced" }, { a: "1 pc", n: "carrot, grated" }, { a: "1 pc", n: "onion, minced" }, { a: "2 pcs", n: "raw eggs" }, { a: "3 tbsp", n: "soy sauce" }],
    steps: ["Mix pork, raw eggs, cheese, soy sauce, carrot, onion, bell pepper, and raisins.", "Lay mixture on aluminum foil, flatten into a rectangle.", "Place hard-boiled egg and sausage slices in the center.", "Roll tightly into a log, sealing the ends of the foil.", "Steam for 45–50 minutes until fully cooked through.", "Cool, slice, and pan-fry cut slices until lightly browned. Serve with ketchup."],
    nutrition: { calories: 295, protein: 18, carbs: 14, fat: 18, fiber: 0.8, sugar: 6, sodium: 580, cholesterol: 118, saturatedFat: 7, potassium: 310, calcium: 48, iron: 1.8 }
  },

  {
    id: "ph060", name: "Pininyahang Manok", category: "Main Dish", region: "Nationwide", emoji: "🍍", cookTime: 45, servings: 5,
    desc: "Chicken braised in pineapple juice and coconut milk with vegetables — sweet, creamy, tropical.",
    ingredients: [{ a: "1 kg", n: "chicken, cut into pieces" }, { a: "1 cup", n: "pineapple chunks" }, { a: "½ cup", n: "pineapple juice" }, { a: "1 can", n: "coconut milk" }, { a: "2 pcs", n: "potatoes, cubed" }, { a: "2 pcs", n: "carrots, sliced" }, { a: "1 pc", n: "red bell pepper" }, { a: "3 cloves", n: "garlic" }, { a: "1 pc", n: "onion" }],
    steps: ["Sauté garlic and onion. Add chicken and brown lightly.", "Pour in pineapple juice and bring to a boil.", "Add potatoes and carrots. Simmer 15 minutes.", "Add coconut milk and pineapple chunks.", "Simmer 10 more minutes until vegetables are tender and sauce thickens.", "Add bell pepper, season with salt and pepper, cook 3 more minutes."],
    nutrition: { calories: 290, protein: 26, carbs: 20, fat: 12, fiber: 2.5, sugar: 10, sodium: 480, cholesterol: 78, saturatedFat: 6, potassium: 560, calcium: 38, iron: 1.8 }
  },

  {
    id: "ph061", name: "Adobong Sitaw", category: "Vegetable Dish", region: "Nationwide", emoji: "🫛", cookTime: 20, servings: 4,
    desc: "String beans cooked adobo-style in vinegar and soy sauce with garlic and pork.",
    ingredients: [{ a: "300g", n: "sitaw (string beans), cut 2-inch" }, { a: "100g", n: "pork belly, sliced" }, { a: "3 tbsp", n: "vinegar" }, { a: "2 tbsp", n: "soy sauce" }, { a: "4 cloves", n: "garlic, crushed" }, { a: "2 pcs", n: "bay leaves" }, { a: "½ tsp", n: "whole black pepper" }],
    steps: ["Sauté garlic until golden. Add pork and cook until browned.", "Add sitaw and toss 1–2 minutes.", "Pour in vinegar — do not stir. Let boil 1 minute.", "Add soy sauce, bay leaves, and peppercorns.", "Cover and cook 8–10 minutes until beans are tender but not mushy.", "Uncover and reduce sauce. Serve with rice."],
    nutrition: { calories: 145, protein: 8, carbs: 12, fat: 7, fiber: 4, sugar: 3, sodium: 640, cholesterol: 22, saturatedFat: 2.2, potassium: 380, calcium: 52, iron: 1.8 }
  },

  {
    id: "ph062", name: "Pakbet Tagalog", category: "Vegetable Dish", region: "Tagalog", emoji: "🥦", cookTime: 25, servings: 4,
    desc: "Tagalog version of pinakbet — uses tomatoes and bagoong alamang instead of bagoong isda.",
    ingredients: [{ a: "1 pc", n: "ampalaya, sliced" }, { a: "100g", n: "sitaw" }, { a: "1 pc", n: "kalabasa, diced" }, { a: "2 pcs", n: "okra" }, { a: "1 pc", n: "eggplant" }, { a: "150g", n: "pork" }, { a: "2 tbsp", n: "bagoong alamang" }, { a: "3 pcs", n: "tomatoes" }, { a: "1 pc", n: "onion" }, { a: "3 cloves", n: "garlic" }],
    steps: ["Sauté garlic, onion, and tomatoes until very soft.", "Add pork and cook until light brown.", "Add bagoong alamang and cook 2 minutes.", "Add all vegetables. Add ¼ cup water.", "Cover and steam-cook for 12–15 minutes.", "Do not stir too much — let the vegetables cook gently."],
    nutrition: { calories: 185, protein: 11, carbs: 19, fat: 8, fiber: 6, sugar: 5, sodium: 780, cholesterol: 28, saturatedFat: 2.2, potassium: 680, calcium: 75, iron: 2.3 }
  },

  {
    id: "ph063", name: "Ginataang Isda", category: "Seafood", region: "Bicol", emoji: "🐟", cookTime: 25, servings: 4,
    desc: "Fish cooked in coconut milk with chili and vegetables — Bicol-style coconut fish stew.",
    ingredients: [{ a: "500g", n: "fish fillets (tilapia or bangus)" }, { a: "1 can", n: "coconut milk" }, { a: "3 pcs", n: "finger chili (siling haba)" }, { a: "2 pcs", n: "bird's eye chili (optional)" }, { a: "1 thumb", n: "ginger, sliced" }, { a: "3 cloves", n: "garlic" }, { a: "1 pc", n: "onion" }, { a: "2 tbsp", n: "fish sauce" }],
    steps: ["Sauté garlic, onion, and ginger in oil.", "Pour in coconut milk and bring to a simmer.", "Add fish and chilies.", "Cook 10–12 minutes without stirring too much.", "Season with fish sauce.", "Serve hot with lots of rice — the coconut sauce is rich and spicy."],
    nutrition: { calories: 265, protein: 28, carbs: 8, fat: 14, fiber: 1.5, sugar: 3, sodium: 560, cholesterol: 72, saturatedFat: 10, potassium: 480, calcium: 60, iron: 1.8 }
  },

  {
    id: "ph064", name: "Ginataang Hipon", category: "Seafood", region: "Nationwide", emoji: "🦐", cookTime: 20, servings: 4,
    desc: "Shrimp in creamy coconut milk with spinach or kangkong — quick and delicious.",
    ingredients: [{ a: "500g", n: "shrimp, peeled and deveined" }, { a: "1 can", n: "coconut milk" }, { a: "1 cup", n: "kangkong or spinach" }, { a: "3 cloves", n: "garlic" }, { a: "1 pc", n: "onion" }, { a: "1 pc", n: "finger chili" }, { a: "2 tbsp", n: "fish sauce" }],
    steps: ["Sauté garlic and onion. Add shrimp and cook until pink.", "Pour in coconut milk. Bring to a gentle simmer.", "Add chili and season with fish sauce.", "Cook 5 minutes until shrimp are cooked through.", "Add kangkong and cook 1 more minute until wilted.", "Serve immediately with steamed rice."],
    nutrition: { calories: 240, protein: 22, carbs: 8, fat: 14, fiber: 1.5, sugar: 3, sodium: 620, cholesterol: 172, saturatedFat: 10, potassium: 440, calcium: 80, iron: 2 }
  },

  {
    id: "ph065", name: "Dinengdeng", category: "Vegetable Dish", region: "Ilocos", emoji: "🥬", cookTime: 25, servings: 4,
    desc: "Ilocano vegetable stew cooked with fish and bagoong isda — full of local greens.",
    ingredients: [{ a: "2 pcs", n: "ampalaya, sliced" }, { a: "1 pc", n: "kalabasa" }, { a: "2 pcs", n: "okra" }, { a: "1 bunch", n: "pako (fern) or kangkong" }, { a: "2 pcs", n: "tomatoes" }, { a: "1 pc", n: "onion" }, { a: "1 grilled fish", n: "(bangus or tilapia)" }, { a: "3 tbsp", n: "bagoong isda" }],
    steps: ["Boil water with tomatoes and onion.", "Add bagoong isda and simmer 5 minutes.", "Add kalabasa and ampalaya; cook 8 minutes.", "Add okra and cook 3 minutes.", "Add pako or kangkong and flaked grilled fish.", "Simmer 2 minutes. Taste and adjust saltiness. Serve."],
    nutrition: { calories: 155, protein: 12, carbs: 16, fat: 5, fiber: 5, sugar: 4, sodium: 680, cholesterol: 35, saturatedFat: 1, potassium: 550, calcium: 68, iron: 2.2 }
  },

  {
    id: "ph066", name: "Paksiw na Lechon", category: "Main Dish", region: "Nationwide", emoji: "🍖", cookTime: 35, servings: 4,
    desc: "The best way to use leftover lechon — simmered in liver sauce and vinegar until tender and sticky.",
    ingredients: [{ a: "600g", n: "leftover lechon pieces" }, { a: "1 cup", n: "lechon sauce (or liver spread)" }, { a: "¼ cup", n: "vinegar" }, { a: "3 pcs", n: "bay leaves" }, { a: "1 tsp", n: "black pepper" }, { a: "1 pc", n: "onion" }, { a: "3 cloves", n: "garlic" }, { a: "½ cup", n: "water" }],
    steps: ["Sauté garlic and onion in a pot.", "Add leftover lechon pieces.", "Pour in vinegar — let boil without stirring for 1 minute.", "Add lechon sauce (or liver spread thinned with water), bay leaves, and pepper.", "Simmer covered 20–25 minutes until sauce is thick and meat is tender.", "Serve with steamed rice. The sauce is wonderful over rice."],
    nutrition: { calories: 440, protein: 28, carbs: 12, fat: 32, fiber: 0.5, sugar: 4, sodium: 680, cholesterol: 120, saturatedFat: 11, potassium: 360, calcium: 22, iron: 2.5 }
  },

  {
    id: "ph067", name: "Pork BBQ Skewers", category: "Street Food", region: "Nationwide", emoji: "🍢", cookTime: 30, servings: 4,
    desc: "Sweet and savory marinated pork skewers grilled over charcoal — iconic Filipino street barbecue.",
    ingredients: [{ a: "500g", n: "pork shoulder or belly, thinly sliced" }, { a: "¼ cup", n: "soy sauce" }, { a: "3 tbsp", n: "calamansi juice" }, { a: "¼ cup", n: "banana catsup" }, { a: "4 cloves", n: "garlic, minced" }, { a: "3 tbsp", n: "brown sugar" }, { a: "½ tsp", n: "pepper" }, { a: "Bamboo skewers", n: "soaked in water" }],
    steps: ["Combine all marinade ingredients: soy sauce, calamansi, catsup, garlic, sugar, pepper.", "Marinate pork strips for at least 2 hours. Overnight is better.", "Thread onto soaked bamboo skewers in a weaving pattern.", "Grill over hot charcoal, basting with marinade every few minutes.", "Cook 3–4 minutes per side until nicely charred and caramelized.", "Serve with spiced vinegar."],
    nutrition: { calories: 265, protein: 20, carbs: 18, fat: 13, fiber: 0.3, sugar: 12, sodium: 640, cholesterol: 68, saturatedFat: 4.5, potassium: 320, calcium: 18, iron: 1.5 }
  },

  {
    id: "ph068", name: "Ukoy", category: "Street Food", region: "Nationwide", emoji: "🦐", cookTime: 20, servings: 4,
    desc: "Crispy shrimp and sweet potato fritters — lacy and crunchy, served with spiced vinegar.",
    ingredients: [{ a: "200g", n: "small shrimp, whole or peeled" }, { a: "1 cup", n: "grated sweet potato (kamote)" }, { a: "½ cup", n: "bean sprouts" }, { a: "¾ cup", n: "all-purpose flour" }, { a: "1 pc", n: "egg" }, { a: "½ cup", n: "annatto water" }, { a: "½ tsp", n: "salt" }, { a: "Oil", n: "for frying" }],
    steps: ["Mix flour, egg, annatto water, and salt to make a thin batter.", "Add shrimp, sweet potato, and bean sprouts to the batter.", "Heat oil in a pan. Drop spoonfuls of batter into oil.", "Press flat with the back of a spoon to form thin fritters.", "Fry 3–4 minutes per side until golden and crispy.", "Serve with spiced vinegar (sukang sawsawan)."],
    nutrition: { calories: 215, protein: 14, carbs: 26, fat: 7, fiber: 2, sugar: 3, sodium: 480, cholesterol: 120, saturatedFat: 1.5, potassium: 340, calcium: 65, iron: 2 }
  },

  {
    id: "ph069", name: "Sago't Gulaman", category: "Drink", region: "Nationwide", emoji: "🧃", cookTime: 30, servings: 4,
    desc: "Refreshing Filipino drink with tapioca pearls and jelly in brown sugar syrup.",
    ingredients: [{ a: "½ cup", n: "large sago (tapioca pearls), cooked" }, { a: "1 pack", n: "gulaman (agar-agar), cooked and cubed" }, { a: "1 cup", n: "brown sugar" }, { a: "4 cups", n: "water" }, { a: "2 pcs", n: "pandan leaves" }, { a: "Ice", n: "for serving" }],
    steps: ["Make syrup: boil brown sugar, water, and pandan leaves 10 minutes until aromatic. Strain and cool.", "Cook sago in boiling water 20–25 minutes until translucent. Rinse under cold water.", "Dissolve gulaman in water per package instructions. Pour into a pan and refrigerate until set.", "Cut set gulaman into small cubes.", "In a tall glass, combine sago and gulaman cubes with ice.", "Pour cold brown sugar syrup over and serve immediately."],
    nutrition: { calories: 165, protein: 1, carbs: 42, fat: 0, fiber: 0.5, sugar: 35, sodium: 12, cholesterol: 0, saturatedFat: 0, potassium: 45, calcium: 8, iron: 0.3 }
  },

  {
    id: "ph070", name: "Buko Juice", category: "Drink", region: "Nationwide", emoji: "🥥", cookTime: 5, servings: 1,
    desc: "Fresh young coconut water with coconut meat — the ultimate natural hydration drink.",
    ingredients: [{ a: "1 pc", n: "young coconut (buko)" }, { a: "Ice", n: "optional" }],
    steps: ["Crack open the young coconut at the top with a bolo or coconut tool.", "Pour the refreshing buko juice into a tall glass with ice.", "Scoop out the tender white coconut meat (buko strips) using a spoon.", "Add the strips to the juice.", "Serve immediately for the freshest flavor.", "Best enjoyed ice cold on a hot day."],
    nutrition: { calories: 95, protein: 1.5, carbs: 20, fat: 1, fiber: 2, sugar: 16, sodium: 52, cholesterol: 0, saturatedFat: 1, potassium: 480, calcium: 22, iron: 0.5 }
  },

  {
    id: "ph071", name: "Champorado", category: "Breakfast", region: "Nationwide", emoji: "🍫", cookTime: 25, servings: 4,
    desc: "Sweet chocolate rice porridge made with tablea (native cacao) — typically paired with dried fish.",
    ingredients: [{ a: "1 cup", n: "glutinous rice" }, { a: "4 pcs", n: "tablea (or 3 tbsp cocoa powder)" }, { a: "4 cups", n: "water" }, { a: "¼ cup", n: "sugar" }, { a: "Evaporated milk", n: "for serving" }, { a: "Tuyo (dried fish)", n: "as pairing" }],
    steps: ["Boil water. Add glutinous rice and cook 15 minutes, stirring often.", "Dissolve tablea in a little hot water. Add to the rice.", "Stir in sugar. Continue cooking until rice is thick and porridge-like.", "Adjust consistency with more water if needed.", "Serve in bowls drizzled with evaporated milk.", "Pair with salty dried fish (tuyo) for the classic sweet-salty combination."],
    nutrition: { calories: 255, protein: 4, carbs: 52, fat: 3.5, fiber: 1.5, sugar: 18, sodium: 85, cholesterol: 5, saturatedFat: 1.8, potassium: 180, calcium: 75, iron: 1.5 }
  },

  {
    id: "ph072", name: "Lugaw", category: "Breakfast", region: "Nationwide", emoji: "🍚", cookTime: 30, servings: 4,
    desc: "Simple plain rice porridge — the most basic Filipino congee, often served to the sick.",
    ingredients: [{ a: "1 cup", n: "rice" }, { a: "6 cups", n: "water or broth" }, { a: "1 thumb", n: "ginger, sliced" }, { a: "3 cloves", n: "garlic, minced (for topping)" }, { a: "2 tbsp", n: "fish sauce" }, { a: "Fried garlic, green onion", n: "for topping" }],
    steps: ["Bring water and ginger to a boil.", "Add rice and stir. Reduce heat and simmer 25–30 minutes, stirring occasionally.", "Cook until rice completely breaks down into smooth porridge.", "Season with fish sauce.", "Serve topped with fried garlic and green onion.", "Optional: drizzle with toasted garlic oil."],
    nutrition: { calories: 175, protein: 4, carbs: 38, fat: 1, fiber: 0.5, sugar: 0.5, sodium: 380, cholesterol: 0, saturatedFat: 0.3, potassium: 65, calcium: 12, iron: 0.8 }
  },

  {
    id: "ph073", name: "Pochero", category: "Main Dish", region: "Nationwide", emoji: "🍲", cookTime: 100, servings: 6,
    desc: "Hearty Spanish-influenced boiled beef with saba banana, chickpeas, and vegetables.",
    ingredients: [{ a: "1 kg", n: "beef (short ribs or shank)" }, { a: "2 pcs", n: "saba banana, halved" }, { a: "1 can", n: "chickpeas" }, { a: "2 pcs", n: "potatoes, quartered" }, { a: "¼ head", n: "cabbage" }, { a: "1 bunch", n: "bok choy" }, { a: "3 pcs", n: "tomatoes" }, { a: "1 pc", n: "onion" }, { a: "3 tbsp", n: "fish sauce" }],
    steps: ["Boil beef in water with onion and tomatoes. Skim foam. Simmer 1 hour.", "Add potatoes and chickpeas. Cook 20 minutes.", "Add saba banana pieces and cook 10 more minutes.", "Add cabbage and bok choy. Cook 5 minutes until wilted.", "Season generously with fish sauce.", "Serve in a large bowl with the rich broth."],
    nutrition: { calories: 310, protein: 25, carbs: 28, fat: 12, fiber: 5.5, sugar: 6, sodium: 540, cholesterol: 68, saturatedFat: 4, potassium: 720, calcium: 68, iron: 3.5 }
  },

  {
    id: "ph074", name: "Inihaw na Liempo", category: "Main Dish", region: "Nationwide", emoji: "🥩", cookTime: 40, servings: 4,
    desc: "Marinated grilled pork belly — caramelized exterior, juicy inside, with spiced vinegar dip.",
    ingredients: [{ a: "1 kg", n: "pork belly slab" }, { a: "¼ cup", n: "soy sauce" }, { a: "3 tbsp", n: "calamansi juice" }, { a: "3 cloves", n: "garlic, minced" }, { a: "3 tbsp", n: "brown sugar" }, { a: "2 tbsp", n: "banana catsup" }, { a: "½ tsp", n: "black pepper" }],
    steps: ["Mix soy sauce, calamansi, garlic, sugar, catsup, and pepper.", "Score pork belly on both sides and marinate for at least 3 hours.", "Grill over medium charcoal heat, skin side down first.", "Cook 15–18 minutes per side, basting with marinade.", "Watch for flare-ups — the sugar can caramelize quickly.", "Slice and serve with spiced vinegar and garlic rice."],
    nutrition: { calories: 450, protein: 22, carbs: 8, fat: 36, fiber: 0.2, sugar: 4, sodium: 640, cholesterol: 110, saturatedFat: 13, potassium: 320, calcium: 20, iron: 1.5 }
  },

  {
    id: "ph075", name: "Chicken Tinola with Sayote", category: "Main Dish", region: "Nationwide", emoji: "🥬", cookTime: 35, servings: 4,
    desc: "Tinolang manok variation with sayote (chayote) instead of green papaya — lighter and refreshing.",
    ingredients: [{ a: "1 kg", n: "chicken, cut into pieces" }, { a: "2 pcs", n: "sayote (chayote), quartered" }, { a: "1 cup", n: "sili leaves or malunggay" }, { a: "1 thumb", n: "ginger, julienned" }, { a: "1 pc", n: "onion" }, { a: "3 cloves", n: "garlic" }, { a: "2 tbsp", n: "fish sauce" }, { a: "4 cups", n: "water" }],
    steps: ["Sauté ginger, garlic, and onion.", "Add chicken, cook until no longer pink.", "Pour in water. Bring to boil, then simmer 20 minutes.", "Add sayote. Cook 8–10 minutes until tender.", "Season with fish sauce.", "Add sili leaves in the last 2 minutes. Serve hot."],
    nutrition: { calories: 195, protein: 24, carbs: 8, fat: 7, fiber: 2, sugar: 3, sodium: 540, cholesterol: 68, saturatedFat: 1.8, potassium: 480, calcium: 72, iron: 2 }
  },

  {
    id: "ph076", name: "Longganisa (Skinless)", category: "Breakfast", region: "Nationwide", emoji: "🌭", cookTime: 20, servings: 6,
    desc: "Sweet garlicky Filipino sausage — the skinless version is easy to make at home.",
    ingredients: [{ a: "500g", n: "ground pork" }, { a: "1 head", n: "garlic, minced" }, { a: "3 tbsp", n: "soy sauce" }, { a: "3 tbsp", n: "brown sugar" }, { a: "1 tbsp", n: "vinegar" }, { a: "1 tsp", n: "salt" }, { a: "½ tsp", n: "pepper" }, { a: "½ tsp", n: "paprika" }],
    steps: ["Combine all ingredients. Mix thoroughly.", "Shape into sausage logs (about 3 inches long).", "Refrigerate at least 1 hour to firm up.", "Cook in a pan with a little water and sugar.", "As water evaporates, the longganisa will fry in its own fat.", "Cook until caramelized and slightly crispy. Serve with garlic rice and egg."],
    nutrition: { calories: 285, protein: 18, carbs: 12, fat: 18, fiber: 0.2, sugar: 8, sodium: 680, cholesterol: 72, saturatedFat: 6.5, potassium: 280, calcium: 20, iron: 1.5 }
  },

  {
    id: "ph077", name: "Ginataang Bilo-Bilo", category: "Dessert", region: "Nationwide", emoji: "🫧", cookTime: 30, servings: 5,
    desc: "Chewy glutinous rice balls and sweet potato in warm coconut milk — a comforting merienda.",
    ingredients: [{ a: "1 cup", n: "glutinous rice flour" }, { a: "½ cup", n: "water" }, { a: "1 can", n: "coconut milk" }, { a: "1 cup", n: "water" }, { a: "1 pc", n: "sweet potato, cubed" }, { a: "2 pcs", n: "saba banana, sliced" }, { a: "½ cup", n: "jack fruit strips" }, { a: "½ cup", n: "cooked sago pearls" }, { a: "½ cup", n: "sugar" }],
    steps: ["Mix rice flour and water to a pliable dough. Shape into small balls.", "Boil coconut milk, water, and sugar. Add sweet potato.", "Cook 8 minutes until potato is half-done.", "Drop in rice balls. Cook until they float (3–4 minutes).", "Add banana, jackfruit, and sago.", "Simmer 5 minutes. Serve warm in bowls."],
    nutrition: { calories: 285, protein: 3, carbs: 52, fat: 8, fiber: 3, sugar: 22, sodium: 28, cholesterol: 0, saturatedFat: 7, potassium: 320, calcium: 28, iron: 1.2 }
  },

  {
    id: "ph078", name: "Sapin-Sapin", category: "Dessert", region: "Nationwide", emoji: "🌈", cookTime: 60, servings: 12,
    desc: "Layered glutinous rice cake in purple (ube), white (coconut), and yellow (langka) layers.",
    ingredients: [{ a: "2 cups", n: "glutinous rice flour" }, { a: "1 can", n: "coconut milk" }, { a: "1 cup", n: "sugar" }, { a: "1 cup", n: "water" }, { a: "3 tbsp", n: "ube flavoring or halaya" }, { a: "3 tbsp", n: "langka (jackfruit) flavoring" }, { a: "Food coloring", n: "(purple, yellow)" }, { a: "Latik", n: "for topping" }],
    steps: ["Mix rice flour, coconut milk, sugar, and water into a smooth batter.", "Divide into 3 equal portions.", "Color one portion purple with ube flavoring, one yellow with langka, leave one plain.", "Steam white layer first in a greased pan for 15 minutes.", "Pour yellow layer on top, steam 15 more minutes.", "Add purple layer, steam final 15 minutes. Cool completely before cutting. Top with latik."],
    nutrition: { calories: 210, protein: 2.5, carbs: 42, fat: 5, fiber: 1.5, sugar: 22, sodium: 25, cholesterol: 0, saturatedFat: 4, potassium: 110, calcium: 15, iron: 0.8 }
  },

  {
    id: "ph079", name: "Kutsinta", category: "Dessert", region: "Nationwide", emoji: "🟠", cookTime: 30, servings: 10,
    desc: "Sticky, chewy orange rice flour cakes served with grated coconut — a merienda classic.",
    ingredients: [{ a: "1 cup", n: "rice flour" }, { a: "½ cup", n: "all-purpose flour" }, { a: "1 cup", n: "brown sugar" }, { a: "2 cups", n: "water" }, { a: "1 tsp", n: "lye water" }, { a: "1 tsp", n: "annatto powder" }, { a: "Grated coconut", n: "for serving" }],
    steps: ["Mix rice flour, all-purpose flour, brown sugar, and annatto in water.", "Stir in lye water last.", "Strain to remove lumps.", "Pour into individual molds (kutsinta molds or small cups), filling ¾ full.", "Steam for 20–25 minutes until set and a toothpick comes out clean.", "Cool, unmold, and serve with freshly grated coconut."],
    nutrition: { calories: 125, protein: 1.5, carbs: 27, fat: 2.5, fiber: 1, sugar: 14, sodium: 20, cholesterol: 0, saturatedFat: 2, potassium: 65, calcium: 10, iron: 0.5 }
  },

  {
    id: "ph080", name: "Taho", category: "Drink", region: "Nationwide", emoji: "🥛", cookTime: 10, servings: 2,
    desc: "Warm silken tofu with brown sugar arnibal syrup and sago pearls — the beloved Filipino street breakfast.",
    ingredients: [{ a: "300g", n: "silken soft tofu, warmed" }, { a: "½ cup", n: "cooked sago pearls" }, { a: "¼ cup", n: "brown sugar" }, { a: "¼ cup", n: "water" }, { a: "1 pc", n: "pandan leaf" }, { a: "1 tsp", n: "vanilla extract (optional)" }],
    steps: ["Make arnibal: simmer brown sugar, water, and pandan leaf 8–10 minutes until syrupy.", "Add vanilla extract and remove pandan. Keep warm.", "Warm silken tofu gently — either in its container or carefully transferred to a pot.", "Scoop soft tofu into cups or bowls.", "Add cooked sago pearls on top.", "Ladle warm arnibal syrup over and serve immediately."],
    nutrition: { calories: 165, protein: 6, carbs: 32, fat: 2.5, fiber: 0.5, sugar: 24, sodium: 35, cholesterol: 0, saturatedFat: 0.5, potassium: 180, calcium: 95, iron: 1.2 }
  },
];

// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════
let currentOffset = 0;
let totalResults = 0;
let currentTab = 'global';
let phCategory = 'All';
let currentPHRecipe = null;
let currentGlobalRecipe = null;

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
function getNutrient(nutrients, name) {
  const n = (nutrients || []).find(n => n.name === name);
  return Math.round(n?.amount ?? 0);
}
function pct(val, max) { return Math.min(100, (val / max) * 100).toFixed(1); }
function hide(el) { if (el) el.style.display = "none"; }
function block(el) { if (el) el.style.display = "block"; }
function flex(el) { if (el) el.style.display = "flex"; }

// ═══════════════════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════════════════
function switchTab(tab) {
  currentTab = tab;
  const gTab = document.getElementById('globalTab');
  const pTab = document.getElementById('phTab');
  const tG = document.getElementById('tabGlobal');
  const tP = document.getElementById('tabPH');
  const mG = document.getElementById('mobTabGlobal');
  const mP = document.getElementById('mobTabPH');
  if (tab === 'global') {
    gTab.style.display = 'block'; pTab.style.display = 'none';
    tG.className = 'tab-btn active'; tP.className = 'tab-btn';
    if (mG) { mG.className = 'mob-tab active'; mP.className = 'mob-tab'; }
  } else {
    gTab.style.display = 'none'; pTab.style.display = 'block';
    tP.className = 'tab-btn active'; tG.className = 'tab-btn';
    if (mP) { mP.className = 'mob-tab active'; mG.className = 'mob-tab'; }
    if (!document.getElementById('phFeatured').innerHTML) initPH();
  }
}

// ═══════════════════════════════════════════════════════════
// GLOBAL (SPOONACULAR) LOGIC
// ═══════════════════════════════════════════════════════════
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const dietFilter = document.getElementById("dietFilter");
const sortFilter = document.getElementById("sortFilter");
const maxCalInput = document.getElementById("maxCalInput");
const totalCount = document.getElementById("totalCount");
const errorBox = document.getElementById("errorBox");
const spinnerWrap = document.getElementById("spinnerWrap");
const emptyStart = document.getElementById("emptyStart");
const emptyResult = document.getElementById("emptyResult");
const recipeGrid = document.getElementById("recipeGrid");
const pagination = document.getElementById("pagination");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");
const modalOverlay = document.getElementById("modalOverlay");
const modalBox = document.getElementById("modalBox");
const modalContent = document.getElementById("modalContent");

// ── Spoonacular fetch with MealDB fallback ──────────────────
async function fetchRecipes(offset = 0) {
  const query = searchInput.value.trim() || "healthy";
  const params = new URLSearchParams({ apiKey: "placeholder", query, addRecipeNutrition: true, number: PER_PAGE, offset, sortDirection: "desc" });
  if (dietFilter.value) params.set("diet", dietFilter.value);
  if (sortFilter.value) params.set("sort", sortFilter.value);
  if (maxCalInput.value) params.set("maxCalories", maxCalInput.value);
  try {
    const res = await spoonacularFetch(`${BASE}/recipes/complexSearch?${params}`);
    if (!res.ok) throw new Error(`Spoonacular API error ${res.status}`);
    const data = await res.json();
    if (data.results && data.results.length > 0) return data;
    throw new Error("No results from Spoonacular");
  } catch (spoonErr) {
    // ── MealDB fallback ──────────────────────────────────────
    console.warn("All Spoonacular keys exhausted, switching to MealDB backup:", spoonErr.message);
    return await fetchRecipesMealDB(query, offset);
  }
}

async function fetchRecipesMealDB(query, offset = 0) {
  const res = await fetch(`${MEALDB}/search.php?s=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`MealDB also failed (${res.status}). Please try again later.`);
  const data = await res.json();
  const all = (data.meals || []).map(m => ({
    id: `mdb_${m.idMeal}`,
    _mealdb: true,
    _raw: m,
    title: m.strMeal,
    image: m.strMealThumb,
    readyInMinutes: null,
    servings: null,
    nutrition: { nutrients: [] },
    diets: [],
    sourceUrl: m.strSource || null,
  }));
  if (!all.length) return { totalResults: 0, results: [] };
  return { totalResults: all.length, results: all.slice(offset, offset + PER_PAGE), _fromMealDB: true };
}

async function fetchDetail(id) {
  // If this is a MealDB-backed id (e.g. "mdb_12345"), skip Spoonacular entirely
  if (typeof id === 'string' && id.startsWith('mdb_')) {
    return await fetchDetailMealDB(id.replace('mdb_', ''));
  }
  try {
    const res = await spoonacularFetch(`${BASE}/recipes/${id}/information?apiKey=placeholder&includeNutrition=true`);
    if (!res.ok) throw new Error(`Spoonacular detail error ${res.status}`);
    const data = await res.json();
    data._fromMealDB = false;
    return data;
  } catch (spoonErr) {
    console.warn("Spoonacular detail unavailable, trying MealDB backup:", spoonErr.message);
    return await fetchDetailMealDB(id);
  }
}

async function fetchDetailMealDB(mealdbId) {
  const res = await fetch(`${MEALDB}/lookup.php?i=${mealdbId}`);
  if (!res.ok) throw new Error(`MealDB detail error ${res.status}`);
  const data = await res.json();
  const m = (data.meals || [])[0];
  if (!m) throw new Error("Recipe not found in MealDB either.");
  // Parse ingredients
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ing = m[`strIngredient${i}`], meas = m[`strMeasure${i}`];
    if (ing && ing.trim()) ingredients.push({ nameClean: ing.trim(), name: ing.trim(), amount: (meas || '').trim(), unit: '' });
  }
  // Parse steps into array
  const raw = (m.strInstructions || '').trim();
  let steps = [];
  if (raw) {
    const byNumber = raw.split(/\r?\n(?=\d+[\.\)]\s?)/).map(s => s.replace(/^\d+[\.\)]\s*/, '').replace(/\r?\n/g, ' ').trim()).filter(Boolean);
    steps = byNumber.length > 1 ? byNumber : raw.split(/\r?\n\r?\n+/).map(s => s.replace(/\r?\n/g, ' ').trim()).filter(Boolean);
  }
  // Return in a Spoonacular-compatible shape so the modal renderer can handle it
  return {
    _fromMealDB: true,
    id: m.idMeal,
    title: m.strMeal,
    image: m.strMealThumb,
    readyInMinutes: null,
    servings: null,
    diets: (m.strTags || '').split(',').filter(Boolean),
    sourceUrl: m.strSource || null,
    _youtubeUrl: m.strYoutube || null,
    _area: m.strArea || null,
    _category: m.strCategory || null,
    nutrition: { nutrients: [] },
    extendedIngredients: ingredients.map(i => ({ ...i, amount: i.amount, unit: '' })),
    analyzedInstructions: steps.length ? [{ steps: steps.map((s, idx) => ({ number: idx + 1, step: s })) }] : [],
  };
}

function makeGlobalCard(recipe) {
  const nutrients = recipe.nutrition?.nutrients || [];
  const cal = getNutrient(nutrients, "Calories");
  const prot = getNutrient(nutrients, "Protein");
  const carb = getNutrient(nutrients, "Carbohydrates");
  const fat = getNutrient(nutrients, "Fat");
  const time = recipe.readyInMinutes ?? "–";
  const img = recipe.image || "";
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="card-img-wrap">
      ${img ? `<img src="${img}" alt="${recipe.title}" loading="lazy"/>` : '<div style="height:100%;background:linear-gradient(145deg,#180d0d,#0d180f);display:flex;align-items:center;justify-content:center;font-size:46px;">🍽️</div>'}
      <div class="overlay"></div>
      <div class="card-time">⏱ ${time}m</div>
      <div class="card-cal">${cal} kcal</div>
    </div>
    <div class="card-body">
      <div class="card-title">${recipe.title}</div>
      <div class="macro-row">
        <div class="macro-cell"><div class="macro-val" style="color:#5CB8FF">${prot}<span>g</span></div><div class="macro-lbl">Protein</div></div>
        <div class="macro-cell"><div class="macro-val" style="color:#D62828">${carb}<span>g</span></div><div class="macro-lbl">Carbs</div></div>
        <div class="macro-cell"><div class="macro-val" style="color:#2D9E5F">${fat}<span>g</span></div><div class="macro-lbl">Fat</div></div>
      </div>
    </div>`;
  card.addEventListener("click", () => openGlobalModal(recipe.id));
  return card;
}

function nutrBar(label, value, unit, max, color) {
  return `<div class="nutr-bar-row">
    <div class="nb-top"><span class="nb-lbl">${label}</span><span class="nb-val">${value}${unit}</span></div>
    <div class="nutr-track"><div class="nutr-fill" style="width:${pct(value, max)}%;background:${color};"></div></div>
  </div>`;
}

async function doSearch(offset = 0) {
  hide(errorBox); hide(emptyStart); hide(emptyResult); hide(pagination);
  const featEl = document.getElementById('globalFeatured');
  if (featEl) featEl.style.display = 'none';
  // Show back bar for manual searches (not triggered by featSearch)
  const backBar = document.getElementById('globalBackBar');
  if (backBar && backBar.style.display === 'none') {
    backBar.style.display = 'flex';
    const lbl = document.getElementById('globalBackLabel');
    const q = document.getElementById('searchInput').value.trim();
    if (lbl) lbl.textContent = q || '';
  }
  recipeGrid.innerHTML = ""; block(spinnerWrap);
  searchBtn.disabled = true; searchBtn.textContent = "…";
  try {
    const data = await fetchRecipes(offset);
    totalResults = data.totalResults || 0; currentOffset = offset;
    const recipes = data.results || [];
    hide(spinnerWrap);
    if (!recipes.length) { block(emptyResult); totalCount.textContent = ""; return; }
    totalCount.textContent = `${totalResults.toLocaleString()} recipes found`;
    recipes.forEach((r, i) => { const c = makeGlobalCard(r); c.style.animationDelay = `${i * 0.05}s`; recipeGrid.appendChild(c); });
    const totalPages = Math.ceil(totalResults / PER_PAGE), currentPage = Math.floor(offset / PER_PAGE) + 1;
    if (totalPages > 1) {
      flex(pagination); pageInfo.textContent = `${currentPage} / ${totalPages}`;
      prevBtn.disabled = currentPage === 1; nextBtn.disabled = currentPage >= totalPages;
    }
  } catch (err) {
    hide(spinnerWrap); errorBox.innerHTML = `<span>⚠️</span> ${err.message}`; block(errorBox);
  } finally { searchBtn.disabled = false; searchBtn.textContent = "Search"; }
}

async function openGlobalModal(id) {
  modalBox.className = ''; currentGlobalRecipe = null;
  modalContent.innerHTML = `<div class="modal-loading"><div class="spinner"></div><p>Loading recipe…</p></div>`;
  modalOverlay.classList.add("open"); document.body.style.overflow = "hidden";
  try {
    const d = await fetchDetail(id);
    currentGlobalRecipe = d;
    // Track in recently viewed
    const rvCal = getNutrient(d.nutrition?.nutrients || [], 'Calories');
    pushRV({ type: 'global', id, name: d.title, img: d.image || '', cal: rvCal || '', emoji: '🍽️' });
    const nutrients = d.nutrition?.nutrients || [];
    const cal = getNutrient(nutrients, "Calories"), prot = getNutrient(nutrients, "Protein");
    const carb = getNutrient(nutrients, "Carbohydrates"), fat = getNutrient(nutrients, "Fat");
    const fiber = getNutrient(nutrients, "Fiber"), sugar = getNutrient(nutrients, "Sugar"), sodium = getNutrient(nutrients, "Sodium");
    const steps = d.analyzedInstructions?.[0]?.steps || [];
    const stepsHTML = steps.length ? `
      <div class="instructions"><div class="section-label">Instructions</div>
        ${steps.map(s => `<div class="step-row"><div class="step-num">${s.number}</div><div class="step-text">${s.step}</div></div>`).join('')}
      </div>`: "";
    const diets = (d.diets || []).slice(0, 2).map(dn => `<div class="stat-chip green"><span>🥗</span><span>${dn}</span></div>`).join('');
    const ingredients = (d.extendedIngredients || []).map(ing => `
      <li><span class="dot"></span><span class="amt">${ing.amount} ${ing.unit}</span><span>${ing.nameClean || ing.name}</span></li>`).join('');

    // ── MealDB-specific extras (shown when Spoonacular was unavailable) ──
    const mealdbBadge = d._fromMealDB ? `
          <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(45,158,95,0.1);border:1px solid rgba(45,158,95,0.3);border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;color:var(--green);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:12px;">
            🔄 Served via MealDB backup
          </div>` : '';
    const mealdbExtras = d._fromMealDB ? `
          ${d._area ? `<div class="stat-chip green"><span>🌍</span><span>${d._area}</span></div>` : ''}
          ${d._category ? `<div class="stat-chip green"><span>📂</span><span>${d._category}</span></div>` : ''}` : '';
    const youtubeBtn = d._youtubeUrl
      ? `<a class="modal-btn src-btn" href="${d._youtubeUrl}" target="_blank" rel="noreferrer">▶ Watch Video</a>` : '';

    const quickStats = d._fromMealDB
      ? `<div class="quick-stats">${mealdbExtras}${diets}</div>`
      : `<div class="quick-stats">
              <div class="stat-chip"><span>⏱</span><span>${d.readyInMinutes} min</span></div>
              <div class="stat-chip"><span>👤</span><span>${d.servings} servings</span></div>
              <div class="stat-chip"><span>🔥</span><span>${cal} kcal</span></div>
              ${diets}
            </div>`;

    const nutritionPanel = d._fromMealDB
      ? `<div class="section-label" style="margin-bottom:8px">Nutrition</div>
             <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px;font-size:13px;color:var(--muted);">
               Detailed nutrition data is available via Spoonacular. MealDB is currently being used as a backup — nutrition info may be unavailable.
             </div>`
      : `<div class="section-label">Nutrition Facts</div>
             <div class="nutr-panel">
               <div class="nutr-cal-row"><span class="nutr-cal-lbl">Calories / serving</span><span class="nutr-cal-val">${cal}</span></div>
               ${nutrBar("Protein", prot, "g", 60, "linear-gradient(90deg,#5CB8FF,#89D4FF)")}
               ${nutrBar("Carbohydrates", carb, "g", 100, "linear-gradient(90deg,#D62828,#FF5555)")}
               ${nutrBar("Fat", fat, "g", 60, "linear-gradient(90deg,#2D9E5F,#55CC88)")}
               ${nutrBar("Fiber", fiber, "g", 30, "linear-gradient(90deg,#9E7A2D,#CCA855)")}
               ${nutrBar("Sugar", sugar, "g", 50, "linear-gradient(90deg,#8B2D9E,#BB66CC)")}
               ${nutrBar("Sodium", sodium, "mg", 2300, "linear-gradient(90deg,#9E3A2D,#CC5544)")}
             </div>`;

    modalContent.innerHTML = `
      <div class="modal-hero">
        ${d.image ? `<img src="${d.image}" alt="${d.title}"/>` : '<div class="modal-hero-emoji">🍽️</div>'}
        <div class="overlay"></div>
        <button id="modalClose">✕</button>
        <div class="modal-title">${d.title}</div>
      </div>
      <div class="modal-body">
        ${mealdbBadge}
        ${quickStats}
        <div class="modal-actions">
          <button class="modal-btn dl-btn" onclick="downloadGlobalPDF()">⬇ Download PDF</button>
          ${favBtnHTML({ type: 'global', id: String(d.id), name: d.title, img: d.image || '', cal: cal, emoji: '🍽️' })}
          ${d.sourceUrl ? `<a class="modal-btn src-btn" href="${d.sourceUrl}" target="_blank" rel="noreferrer">🔗 View Original</a>` : ''}
          ${youtubeBtn}
        </div>
        <div class="modal-grid">
          <div>${nutritionPanel}</div>
          <div>
            <div class="section-label green">Ingredients</div>
            <ul class="ingredient-list">${ingredients}</ul>
          </div>
        </div>
        ${stepsHTML}
      </div>`;
    document.getElementById("modalClose").addEventListener("click", closeModal);
  } catch (err) {
    modalContent.innerHTML = `<div class="modal-error"><div class="em">⚠️</div><p>${err.message}</p><button onclick="closeModal()">Close</button></div>`;
  }
}

// ═══════════════════════════════════════════════════════════
// 🇵🇭 FILIPINO LOGIC
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// 🇵🇭 FILIPINO LOGIC — Featured Category Grid
// ═══════════════════════════════════════════════════════════
const PH_CATS_LIST = [...new Set(PH_DB.map(r => r.category))];

// One representative dish id per category (for the card background image)
const PH_CAT_REPR = {
  "Main Dish": "ph001",
  "Noodle Dish": "ph023",
  "Rice Dish": "ph025",
  "Street Food": "ph030",
  "Seafood": "ph034",
  "Vegetable Dish": "ph038",
  "Breakfast": "ph041",
  "Dessert": "ph045",
  "Side Dish": "ph053",
  "Drink": "ph070",
};

function renderPHFeatured() {
  const wrap = document.getElementById('phFeatured');
  if (!wrap) return;
  const counts = {};
  PH_DB.forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1; });
  wrap.style.display = 'block';
  wrap.innerHTML = `
    <div class="feat-header">
      <div class="feat-title">Explore Filipino Cuisine</div>
    </div>
    <div class="feat-grid">
      ${PH_CATS_LIST.map(cat => {
    const reprId = PH_CAT_REPR[cat];
    const img = reprId ? (PH_IMG[reprId] || CAT_FALLBACK[cat] || CAT_FALLBACK['Main Dish']) : (CAT_FALLBACK[cat] || CAT_FALLBACK['Main Dish']);
    return `
        <div class="feat-card ph-feat-card" onclick="phCatSearch('${cat}')">
          <img src="${img}" alt="${cat}" loading="lazy"
               onerror="this.src='${CAT_FALLBACK[cat] || CAT_FALLBACK['Main Dish']}'"/>
          <div class="feat-overlay"></div>
          <div class="feat-label">${cat}</div>
        </div>`;
  }).join('')}
    </div>`;
}

function showPHFeatured() {
  renderPHFeatured();
  document.getElementById('phBackBar').style.display = 'none';
  document.getElementById('phGrid').innerHTML = '';
  document.getElementById('phGrid').style.display = 'none';
  document.getElementById('phEmpty').style.display = 'none';
  document.getElementById('phCount').textContent = '';
  document.getElementById('phSearchInput').value = '';
  phCategory = 'All';
}

function phCatSearch(cat) {
  phCategory = cat;
  document.getElementById('phFeatured').style.display = 'none';
  const backBar = document.getElementById('phBackBar');
  backBar.style.display = 'flex';
  document.getElementById('phBackLabel').textContent = cat;
  applyPHFilter();
}

function initPH() {
  renderPHFeatured();
}

function applyPHFilter() {
  const q = document.getElementById('phSearchInput').value.toLowerCase().trim();
  let results = PH_DB;
  if (phCategory !== 'All') results = results.filter(r => r.category === phCategory);
  if (q) results = results.filter(r =>
    r.name.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q) ||
    r.region.toLowerCase().includes(q) || r.category.toLowerCase().includes(q) ||
    r.ingredients.some(i => i.n.toLowerCase().includes(q))
  );
  // If searching, hide featured and show back bar
  if (q) {
    document.getElementById('phFeatured').style.display = 'none';
    const backBar = document.getElementById('phBackBar');
    backBar.style.display = 'flex';
    document.getElementById('phBackLabel').textContent = q;
    phCategory = 'All';
  }
  renderPH(results);
}

function renderPH(results) {
  const grid = document.getElementById('phGrid');
  const empty = document.getElementById('phEmpty');
  const count = document.getElementById('phCount');
  grid.innerHTML = '';
  if (!results.length) { grid.style.display = 'none'; block(empty); count.textContent = ''; return; }
  grid.style.display = 'grid'; hide(empty);
  count.textContent = `${results.length} dish${results.length !== 1 ? 'es' : ''} found`;
  results.forEach((r, i) => {
    const card = makePHCard(r, i); card.style.animationDelay = `${i * 0.04}s`; grid.appendChild(card);
  });
}

function makePHCard(r, i) {
  const n = r.nutrition;
  const card = document.createElement('div'); card.className = 'ph-card';
  card.innerHTML = `
    <div class="card-emoji-wrap">
      <img src="${getPHImg(r)}" alt="${r.name}" loading="lazy"
        onerror="mdbImageFallback(this, '${r.name.replace(/'/g, "\\'")}', '${r.emoji}')"/>
      <div class="emoji-fallback">${r.emoji}</div>
      <div class="overlay"></div>
      <div class="card-time">⏱ ${r.cookTime}m</div>
      <div class="card-cal">${n.calories} kcal</div>
      <div class="card-region">${r.region}</div>
    </div>
    <div class="card-body">
      <div class="card-title">${r.name}</div>
      <div class="card-desc">${r.desc}</div>
      <div class="macro-row">
        <div class="macro-cell"><div class="macro-val" style="color:#5CB8FF">${n.protein}<span>g</span></div><div class="macro-lbl">Protein</div></div>
        <div class="macro-cell"><div class="macro-val" style="color:#D62828">${n.carbs}<span>g</span></div><div class="macro-lbl">Carbs</div></div>
        <div class="macro-cell"><div class="macro-val" style="color:#2D9E5F">${n.fat}<span>g</span></div><div class="macro-lbl">Fat</div></div>
      </div>
    </div>`;
  card.addEventListener('click', () => openPHModal(r.id));
  return card;
}

// Try MealDB for a matching image before giving up and showing emoji
async function mdbImageFallback(imgEl, dishName, emoji) {
  try {
    const res = await fetch(`${MEALDB}/search.php?s=${encodeURIComponent(dishName)}`);
    const data = await res.json();
    const meal = (data.meals || [])[0];
    if (meal && meal.strMealThumb) {
      imgEl.src = meal.strMealThumb;
      imgEl.onerror = () => { imgEl.style.display = 'none'; imgEl.nextElementSibling.style.display = 'flex'; };
      return;
    }
  } catch (_) { /* ignore */ }
  // Final fallback: emoji
  imgEl.style.display = 'none';
  imgEl.nextElementSibling.style.display = 'flex';
}

function openPHModal(id) {
  const r = PH_DB.find(x => x.id === id); if (!r) return;
  currentPHRecipe = r;
  // Track in recently viewed
  pushRV({ type: 'ph', id, name: r.name, img: getPHImg(r), cal: r.nutrition.calories, emoji: r.emoji });
  modalBox.className = '';
  const n = r.nutrition;
  const stepsHTML = r.steps.length ? `
    <div class="instructions"><div class="section-label">Instructions</div>
      ${r.steps.map((s, i) => `<div class="step-row"><div class="step-num">${i + 1}</div><div class="step-text">${s}</div></div>`).join('')}
    </div>`: '';
  const ingredientsHTML = r.ingredients.map(i => `
    <li><span class="dot"></span><span class="amt">${i.a}</span><span>${i.n}</span></li>`).join('');
  modalContent.innerHTML = `
    <div class="modal-hero">
      <img src="${getPHImg(r)}" alt="${r.name}"
        style="width:100%;height:100%;object-fit:cover;border-radius:24px 24px 0 0;display:block;"
        onerror="mdbImageFallback(this, '${r.name.replace(/'/g, "\\'")}', '${r.emoji}')"/>
      <div class="modal-hero-emoji" style="display:none">${r.emoji}</div>
      <div class="overlay"></div>
      <button id="modalClose">✕</button>
      <div class="modal-title">${r.name}</div>
    </div>
    <div class="modal-body">
      <div class="quick-stats">
        <div class="stat-chip"><span>⏱</span><span>${r.cookTime} min</span></div>
        <div class="stat-chip"><span>👤</span><span>${r.servings} servings</span></div>
        <div class="stat-chip"><span>🔥</span><span>${n.calories} kcal</span></div>
        <div class="stat-chip green"><span>📍</span><span>${r.region}</span></div>
        <div class="stat-chip green"><span>📂</span><span>${r.category}</span></div>
      </div>
      <div class="modal-actions">
        <button class="modal-btn dl-btn" onclick="downloadPHPDF()">⬇ Download PDF</button>
        ${favBtnHTML({ type: 'ph', id: r.id, name: r.name, img: getPHImg(r), cal: n.calories, emoji: r.emoji })}
      </div>
      <div class="modal-grid">
        <div>
          <div class="section-label">Nutrition Facts</div>
          <div class="nutr-panel">
            <div class="nutr-cal-row"><span class="nutr-cal-lbl">Calories / serving</span><span class="nutr-cal-val">${n.calories}</span></div>
            ${nutrBar("Protein", n.protein, "g", 60, "linear-gradient(90deg,#5CB8FF,#89D4FF)")}
            ${nutrBar("Carbohydrates", n.carbs, "g", 100, "linear-gradient(90deg,#D62828,#FF5555)")}
            ${nutrBar("Fat", n.fat, "g", 60, "linear-gradient(90deg,#2D9E5F,#55CC88)")}
            ${nutrBar("Fiber", n.fiber, "g", 30, "linear-gradient(90deg,#9E7A2D,#CCA855)")}
            ${nutrBar("Sugar", n.sugar, "g", 50, "linear-gradient(90deg,#8B2D9E,#BB66CC)")}
            ${nutrBar("Sodium", n.sodium, "mg", 2300, "linear-gradient(90deg,#9E3A2D,#CC5544)")}
          </div>
          <div class="extra-nutr">
            <div class="section-label green" style="margin-top:14px;">More Nutrients</div>
            <div class="extra-nutr-grid">
              <div class="extra-nutr-item"><span class="en-lbl">Cholesterol</span><span class="en-val">${n.cholesterol}mg</span></div>
              <div class="extra-nutr-item"><span class="en-lbl">Saturated Fat</span><span class="en-val">${n.saturatedFat}g</span></div>
              <div class="extra-nutr-item"><span class="en-lbl">Potassium</span><span class="en-val">${n.potassium}mg</span></div>
              <div class="extra-nutr-item"><span class="en-lbl">Calcium</span><span class="en-val">${n.calcium}mg</span></div>
              <div class="extra-nutr-item"><span class="en-lbl">Iron</span><span class="en-val">${n.iron}mg</span></div>
            </div>
          </div>
        </div>
        <div>
          <div class="section-label green">Ingredients</div>
          <ul class="ingredient-list">${ingredientsHTML}</ul>
        </div>
      </div>
      ${stepsHTML}
    </div>`;
  modalOverlay.classList.add("open"); document.body.style.overflow = "hidden";
  document.getElementById("modalClose").addEventListener("click", closeModal);
}

function closeModal() {
  modalOverlay.classList.remove("open"); document.body.style.overflow = "";
  modalContent.innerHTML = ""; currentGlobalRecipe = null; currentPHRecipe = null;
}

// ═══════════════════════════════════════════════════════════
// PDF DOWNLOAD — FILIPINO
// ═══════════════════════════════════════════════════════════
function downloadPHPDF() {
  const r = currentPHRecipe; if (!r) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const n = r.nutrition;
  const W = 210, PG = 297;

  // ── Green header bar ──
  doc.setFillColor(21, 128, 61); doc.rect(0, 0, W, 36, 'F');
  // thin red accent line
  doc.setFillColor(180, 10, 20); doc.rect(0, 36, W, 3, 'F');

  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20); doc.setFont('helvetica', 'bold');
  doc.text('Meal Nutrify', 14, 16);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('Filipino Recipe Nutrition Report', 14, 24);
  doc.setFontSize(8); doc.setTextColor(180, 230, 190);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-PH', { dateStyle: 'long' })}`, 14, 31);

  // emoji + title
  let y = 50;
  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 20);
  const titleLines = doc.splitTextToSize(r.name, 160);
  doc.text(titleLines, 15, y - 4 + (titleLines.length === 1 ? 4 : 0));
  y += titleLines.length > 1 ? titleLines.length * 7 + 4 : 12;

  // Meta row
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 100);
  doc.text(`category: ${r.category}   region: ${r.region}   cook time: ${r.cookTime} min   servings: ${r.servings}`, 14, y);
  y += 6;

  // desc
  doc.setFontSize(9); doc.setTextColor(60, 70, 90);
  const descLines = doc.splitTextToSize(r.desc, 182);
  doc.text(descLines, 14, y);
  y += descLines.length * 5 + 6;

  // ── Divider ──
  doc.setDrawColor(200, 205, 215); doc.line(14, y, 196, y); y += 8;

  // ── Nutrition Facts ──
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(180, 10, 20);
  doc.text('Nutrition Facts', 14, y); y += 8;

  // Calorie big box
  doc.setFillColor(254, 242, 242); doc.roundedRect(14, y, 180, 18, 3, 3, 'F');
  doc.setDrawColor(230, 60, 60); doc.roundedRect(14, y, 180, 18, 3, 3, 'S');
  doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 30, 30);
  doc.text('Calories per serving', 20, y + 7);
  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(180, 10, 20);
  doc.text(`${n.calories} kcal`, 160, y + 11, { align: 'right' });
  y += 24;

  // Macro boxes (4 in a row)
  const macros = [['Protein', `${n.protein}g`, [37, 99, 235]], ['Carbs', `${n.carbs}g`, [251, 176, 59]], ['Fat', `${n.fat}g`, [239, 68, 68]], ['Fiber', `${n.fiber}g`, [22, 163, 74]]];
  macros.forEach(([lbl, val, clr], i) => {
    const x = 14 + i * 43;
    doc.setFillColor(...clr); doc.roundedRect(x, y, 40, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text(val, x + 20, y + 8, { align: 'center' });
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text(lbl, x + 20, y + 13, { align: 'center' });
  });
  y += 22;

  // Detail nutrients grid
  const details = [
    ['Sugar', `${n.sugar}g`], ['Sodium', `${n.sodium}mg`], ['Cholesterol', `${n.cholesterol}mg`],
    ['Saturated Fat', `${n.saturatedFat}g`], ['Potassium', `${n.potassium}mg`],
    ['Calcium', `${n.calcium}mg`], ['Iron', `${n.iron}mg`]
  ];
  const half = Math.ceil(details.length / 2);
  [details.slice(0, half), details.slice(half)].forEach((col, ci) => {
    col.forEach(([lbl, val], ri) => {
      const rx = 14 + ci * 93, ry = y + ri * 8;
      if (ri % 2 === 0) { doc.setFillColor(248, 248, 252); doc.rect(rx, ry - 4, 89, 8, 'F'); }
      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 90, 110);
      doc.text(lbl, rx + 3, ry + 1);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 30, 60);
      doc.text(val, rx + 83, ry + 1, { align: 'right' });
    });
  });
  y += half * 8 + 10;

  // ── Divider ──
  doc.setDrawColor(200, 205, 215); doc.line(14, y, 196, y); y += 8;

  // ── Ingredients ──
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(21, 128, 61);
  doc.text('Ingredients', 14, y); y += 8;
  r.ingredients.forEach((ing, i) => {
    if (y > PG - 40) { doc.addPage(); y = 20; }
    if (i % 2 === 0) { doc.setFillColor(246, 252, 248); doc.rect(14, y - 4, 182, 8, 'F'); }
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(21, 128, 61);
    doc.text(ing.a, 18, y + 1);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 50, 60);
    const nm = doc.splitTextToSize(ing.n, 140);
    doc.text(nm[0], 55, y + 1);
    y += 8;
  });
  y += 4;

  // ── Divider ──
  if (y > PG - 60) { doc.addPage(); y = 20; }
  doc.setDrawColor(200, 205, 215); doc.line(14, y, 196, y); y += 8;

  // ── Instructions ──
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(180, 10, 20);
  doc.text('Instructions', 14, y); y += 8;
  r.steps.forEach((step, i) => {
    if (y > PG - 30) { doc.addPage(); y = 20; }
    // step number circle
    doc.setFillColor(180, 10, 20); doc.circle(18, y - 1, 4, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text(`${i + 1}`, 18, y + 1, { align: 'center' });
    // step text
    doc.setTextColor(40, 50, 60); doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(step, 164);
    doc.text(lines, 26, y + 1);
    y += lines.length * 5 + 5;
  });

  // ── Footer ──
  doc.setFillColor(21, 128, 61); doc.rect(0, PG - 12, W, 12, 'F');
  doc.setTextColor(180, 240, 190); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
  doc.text('Generated by MealNutrify', 14, PG - 5);
  doc.text('Nutrition values are estimates. Consult a registered nutritionist for medical advice.', W - 14, PG - 5, { align: 'right' });

  doc.save(`MealNutrify_${r.name.replace(/[^a-z0-9]/gi, '_')}.pdf`);
}

// ═══════════════════════════════════════════════════════════
// PDF DOWNLOAD — GLOBAL (Spoonacular)
// ═══════════════════════════════════════════════════════════
function downloadGlobalPDF() {
  const d = currentGlobalRecipe; if (!d) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const nutrients = d.nutrition?.nutrients || [];
  const get = (name) => { const n = nutrients.find(x => x.name === name); return n ? `${Math.round(n.amount)}${n.unit}` : '—'; };
  const getNum = (name) => { const n = nutrients.find(x => x.name === name); return Math.round(n?.amount ?? 0); };
  const W = 210, PG = 297;

  // ── Gold header ──
  doc.setFillColor(30, 42, 60); doc.rect(0, 0, W, 36, 'F');
  doc.setFillColor(251, 176, 59); doc.rect(0, 36, W, 3, 'F');
  doc.setTextColor(251, 176, 59); doc.setFontSize(20); doc.setFont('helvetica', 'bold');
  doc.text('Meal Nutrify', 14, 16);
  doc.setTextColor(200, 200, 200); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('Global Recipe Nutrition Report', 14, 24);
  doc.setFontSize(8); doc.setTextColor(120, 130, 150);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 31);

  let y = 50;
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 40);
  const titleLines = doc.splitTextToSize(d.title, 182);
  doc.text(titleLines, 14, y);
  y += titleLines.length * 8 + 4;

  // meta
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 90, 110);
  doc.text([`time: ${d.readyInMinutes} min`, `servings: ${d.servings}`, `calories: ${getNum('Calories')} kcal`].join('   '), 14, y);
  y += 10;

  // Divider
  doc.setDrawColor(220, 225, 235); doc.line(14, y, 196, y); y += 8;
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(251, 176, 59);
  doc.text('Nutrition Facts', 14, y); y += 8;

  // Calorie row
  doc.setFillColor(255, 248, 235); doc.roundedRect(14, y, 180, 16, 3, 3, 'F');
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 60, 0);
  doc.text('Calories / serving', 20, y + 7);
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(200, 100, 0);
  doc.text(`${getNum('Calories')} kcal`, 160, y + 10, { align: 'right' });
  y += 22;

  const macros2 = [['Protein', get('Protein'), [37, 99, 235]], ['Carbs', get('Carbohydrates'), [251, 176, 59]], ['Fat', get('Fat'), [239, 68, 68]], ['Fiber', get('Fiber'), [22, 163, 74]]];
  macros2.forEach(([lbl, val, clr], i) => {
    const x = 14 + i * 43;
    doc.setFillColor(...clr); doc.roundedRect(x, y, 40, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text(val, x + 20, y + 8, { align: 'center' });
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text(lbl, x + 20, y + 13, { align: 'center' });
  });
  y += 22;

  const dets2 = [['Sugar', get('Sugar')], ['Sodium', get('Sodium')], ['Cholesterol', get('Cholesterol')], ['Saturated Fat', get('Saturated Fat')], ['Potassium', get('Potassium')], ['Calcium', get('Calcium')]];
  const h2 = Math.ceil(dets2.length / 2);
  [dets2.slice(0, h2), dets2.slice(h2)].forEach((col, ci) => {
    col.forEach(([lbl, val], ri) => {
      const rx = 14 + ci * 93, ry = y + ri * 8;
      if (ri % 2 === 0) { doc.setFillColor(248, 248, 252); doc.rect(rx, ry - 4, 89, 8, 'F'); }
      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 90, 110);
      doc.text(lbl, rx + 3, ry + 1);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 30, 60);
      doc.text(val, rx + 83, ry + 1, { align: 'right' });
    });
  });
  y += h2 * 8 + 10;

  // Ingredients
  if (y > PG - 60) { doc.addPage(); y = 20; }
  doc.setDrawColor(220, 225, 235); doc.line(14, y, 196, y); y += 8;
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(251, 176, 59);
  doc.text('Ingredients', 14, y); y += 8;
  (d.extendedIngredients || []).forEach((ing, i) => {
    if (y > PG - 30) { doc.addPage(); y = 20; }
    if (i % 2 === 0) { doc.setFillColor(250, 248, 238); doc.rect(14, y - 4, 182, 8, 'F'); }
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(160, 100, 0);
    doc.text(`${ing.amount} ${ing.unit}`, 18, y + 1);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 50, 60);
    const nm = doc.splitTextToSize(ing.nameClean || ing.name, 130);
    doc.text(nm[0], 70, y + 1);
    y += 8;
  });
  y += 4;

  // Instructions
  const steps = d.analyzedInstructions?.[0]?.steps || [];
  if (steps.length) {
    if (y > PG - 40) { doc.addPage(); y = 20; }
    doc.setDrawColor(220, 225, 235); doc.line(14, y, 196, y); y += 8;
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(251, 176, 59);
    doc.text('Instructions', 14, y); y += 8;
    steps.forEach((s, i) => {
      if (y > PG - 30) { doc.addPage(); y = 20; }
      doc.setFillColor(200, 140, 0); doc.circle(18, y - 1, 4, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
      doc.text(`${s.number}`, 18, y + 1, { align: 'center' });
      doc.setTextColor(40, 50, 60); doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(s.step, 164);
      doc.text(lines, 26, y + 1);
      y += lines.length * 5 + 5;
    });
  }

  // Source link
  if (d.sourceUrl) {
    y += 4;
    doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(93, 184, 255);
    doc.text(`Source: ${d.sourceUrl}`, 14, y);
  }

  // Footer
  doc.setFillColor(30, 42, 60); doc.rect(0, PG - 12, W, 12, 'F');
  doc.setTextColor(120, 130, 150); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
  doc.text('Generated by MealNutrify • Powered by Spoonacular API', 14, PG - 5);
  doc.text('Nutrition values are approximate.', W - 14, PG - 5, { align: 'right' });

  doc.save(`MealNutrify_${d.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
}

// ═══════════════════════════════════════════════════════════
// THEME TOGGLE (dark ↔ light)
// ═══════════════════════════════════════════════════════════
(function initTheme() {
  const saved = localStorage.getItem('mn-theme');
  if (saved === 'light') {
    document.body.classList.add('light-mode');
    syncMobThemeIcon(true);
  }
})();

document.getElementById('themeToggle').addEventListener('click', function () {
  const isLight = document.body.classList.toggle('light-mode');
  localStorage.setItem('mn-theme', isLight ? 'light' : 'dark');
  syncMobThemeIcon(isLight);
});

function syncMobThemeIcon(isLight) {
  const mob = document.getElementById('mobThemeIcon');
  if (mob) mob.textContent = isLight ? '☀️' : '🌙';
}

// ═══════════════════════════════════════════════════════════
// PANEL MANAGEMENT (Recently Viewed & Favorites)
// ═══════════════════════════════════════════════════════════
let activePanelId = null;

function togglePanel(which) {
  const panelId = which === 'rv' ? 'rvPanel' : 'favPanel';
  const btnId = which === 'rv' ? 'rvToggleBtn' : 'favToggleBtn';
  const panel = document.getElementById(panelId);
  const btn = document.getElementById(btnId);
  const backdrop = document.getElementById('panelBackdrop');

  if (activePanelId === which) {
    // Close
    panel.style.display = 'none';
    backdrop.style.display = 'none';
    btn.classList.remove('active');
    activePanelId = null;
    document.body.style.overflow = '';
  } else {
    // Close any open panel first
    closeAllPanels();
    // Open this one
    if (which === 'rv') renderRVPanel();
    else renderFavPanel();
    panel.style.display = 'flex';
    backdrop.style.display = 'block';
    btn.classList.add('active');
    activePanelId = which;
    document.body.style.overflow = 'hidden';
  }
}

function closeAllPanels() {
  ['rvPanel', 'favPanel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const backdrop = document.getElementById('panelBackdrop');
  if (backdrop) backdrop.style.display = 'none';
  document.getElementById('rvToggleBtn')?.classList.remove('active');
  document.getElementById('favToggleBtn')?.classList.remove('active');
  activePanelId = null;
  // Only clear overflow if modal isn't open
  if (!document.getElementById('modalOverlay')?.classList.contains('open')) {
    document.body.style.overflow = '';
  }
}

// ═══════════════════════════════════════════════════════════
// RECENTLY VIEWED
// ═══════════════════════════════════════════════════════════
const RV_KEY = 'mn-recently-viewed';
const RV_MAX = 10;

function getRV() {
  try { return JSON.parse(localStorage.getItem(RV_KEY)) || []; } catch { return []; }
}

function saveRV(arr) {
  localStorage.setItem(RV_KEY, JSON.stringify(arr));
}

function pushRV(entry) {
  let arr = getRV();
  arr = arr.filter(x => x.id !== entry.id);
  arr.unshift(entry);
  if (arr.length > RV_MAX) arr = arr.slice(0, RV_MAX);
  saveRV(arr);
  updateRVBadge();
  if (activePanelId === 'rv') renderRVPanel();
}

function clearRecentlyViewed() {
  saveRV([]);
  updateRVBadge();
  renderRVPanel();
}

function updateRVBadge() {
  const arr = getRV();
  const badge = document.getElementById('rvBadge');
  if (!badge) return;
  if (arr.length > 0) {
    badge.textContent = arr.length > 9 ? '9+' : arr.length;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

function renderRVPanel() {
  const arr = getRV();
  const body = document.getElementById('rvPanelContent');
  if (!body) return;
  if (!arr.length) {
    body.innerHTML = `
      <div class="sp-empty">
        <div class="sp-empty-icon">🕐</div>
        <p>No recently viewed recipes yet.</p>
        <p class="sp-empty-sub">Open any recipe to start tracking.</p>
      </div>`;
    return;
  }
  body.innerHTML = arr.map(e => `
    <div class="sp-recipe-card" onclick="openFromPanel('${e.type}','${e.id}')">
      ${e.img
      ? `<img class="sp-card-img" src="${e.img}" alt="${e.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
           <div class="sp-card-emoji" style="display:none">${e.emoji || '🍽️'}</div>`
      : `<div class="sp-card-emoji">${e.emoji || '🍽️'}</div>`
    }
      <div class="sp-card-info">
        <div class="sp-card-name">${e.name}</div>
        <div class="sp-card-meta">${e.cal ? e.cal + ' kcal' : ''}</div>
        <span class="sp-card-badge ${e.type}">${e.type === 'ph' ? '🇵🇭 Filipino' : '🌍 Global'}</span>
      </div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════════════════
// FAVORITES
// ═══════════════════════════════════════════════════════════
const FAV_KEY = 'mn-favorites';

function getFavs() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch { return []; }
}

function saveFavs(arr) {
  localStorage.setItem(FAV_KEY, JSON.stringify(arr));
}

function isFav(id) {
  return getFavs().some(x => x.id === id);
}

function toggleFav(entry) {
  let arr = getFavs();
  if (arr.some(x => x.id === entry.id)) {
    arr = arr.filter(x => x.id !== entry.id);
  } else {
    arr.unshift(entry);
  }
  saveFavs(arr);
  updateFavBadge();
  if (activePanelId === 'fav') renderFavPanel();
  // Update any open modal button
  const btn = document.getElementById('favModalBtn');
  if (btn) {
    const faved = isFav(entry.id);
    btn.textContent = faved ? '❤️ Saved' : '🤍 Save';
    btn.classList.toggle('is-fav', faved);
  }
}

function clearFavorites() {
  saveFavs([]);
  updateFavBadge();
  renderFavPanel();
}

function updateFavBadge() {
  const arr = getFavs();
  const badge = document.getElementById('favBadge');
  if (!badge) return;
  if (arr.length > 0) {
    badge.textContent = arr.length > 9 ? '9+' : arr.length;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

function renderFavPanel() {
  const arr = getFavs();
  const body = document.getElementById('favPanelContent');
  if (!body) return;
  if (!arr.length) {
    body.innerHTML = `
      <div class="sp-empty">
        <div class="sp-empty-icon">🤍</div>
        <p>No favorites saved yet.</p>
        <p class="sp-empty-sub">Tap the 🤍 on any recipe to save it here.</p>
      </div>`;
    return;
  }
  body.innerHTML = arr.map(e => `
    <div class="sp-recipe-card" onclick="openFromPanel('${e.type}','${e.id}')">
      ${e.img
      ? `<img class="sp-card-img" src="${e.img}" alt="${e.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
           <div class="sp-card-emoji" style="display:none">${e.emoji || '🍽️'}</div>`
      : `<div class="sp-card-emoji">${e.emoji || '🍽️'}</div>`
    }
      <div class="sp-card-info">
        <div class="sp-card-name">${e.name}</div>
        <div class="sp-card-meta">${e.cal ? e.cal + ' kcal' : ''}</div>
        <span class="sp-card-badge ${e.type}">${e.type === 'ph' ? '🇵🇭 Filipino' : '🌍 Global'}</span>
      </div>
      <button class="sp-remove-btn" onclick="event.stopPropagation(); removeFav('${e.id}')" title="Remove">✕</button>
    </div>
  `).join('');
}

function removeFav(id) {
  let arr = getFavs().filter(x => x.id !== id);
  saveFavs(arr);
  updateFavBadge();
  renderFavPanel();
}

function openFromPanel(type, id) {
  closeAllPanels();
  if (type === 'ph') openPHModal(id);
  else openGlobalModal(id);
}

// Helper to build the fav button HTML inside modals
function favBtnHTML(entry) {
  const faved = isFav(entry.id);
  return `<button id="favModalBtn" class="modal-btn fav-toggle-btn ${faved ? 'is-fav' : ''}"
    onclick="toggleFav(${JSON.stringify(entry).replace(/"/g, '&quot;')})">${faved ? '❤️ Saved' : '🤍 Save'}</button>`;
}

// ═══════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════
searchBtn.addEventListener("click", () => doSearch(0));
searchInput.addEventListener("keydown", e => { if (e.key === "Enter") doSearch(0); });
prevBtn.addEventListener("click", () => doSearch(currentOffset - PER_PAGE));
nextBtn.addEventListener("click", () => doSearch(currentOffset + PER_PAGE));
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

document.getElementById('phSearchBtn').addEventListener('click', applyPHFilter);
document.getElementById('phSearchInput').addEventListener('keydown', e => { if (e.key === 'Enter') applyPHFilter(); });

// Render featured cuisine grid on load
renderGlobalFeatured();
// Init badges on load
updateRVBadge();
updateFavBadge();
