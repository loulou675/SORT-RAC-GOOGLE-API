import type {
  Bin,
  BinCode,
  ComponentAction,
  ConditionKey,
  ConditionQuestion,
  DisposalRule,
  Material,
  MaterialCode,
  ReuseSuggestion,
  SiteProfile,
  VerificationStatus,
  WasteItem,
} from '../types/domain'

const SIGNAGE: VerificationStatus = 'BASED_ON_LOCAL_GUIDANCE'
const PENDING: VerificationStatus = 'PENDING_CONFIRMATION'

interface ExpandedItemSpec {
  code: string
  nameVi: string
  nameEn: string
  material: MaterialCode
  objectType: string
  destination: BinCode
  aliasesVi?: string[]
  aliasesEn?: string[]
}

// The six-bin station still needs a broad catalogue so Google can distinguish
// common household objects before applying the condition and disposal rules.
const expandedItemSpecs: ExpandedItemSpec[] = [
  {
    code: 'plastic_milk_bottle', nameVi: 'Chai sữa nhựa', nameEn: 'Plastic milk bottle', material: 'pet_plastic', objectType: 'bottle', destination: 'bottle_can',
    aliasesVi: ['chai sữa', 'chai nhựa đựng sữa'], aliasesEn: ['milk bottle', 'plastic milk jug'],
  },
  {
    code: 'plastic_juice_bottle', nameVi: 'Chai nước trái cây nhựa', nameEn: 'Plastic juice bottle', material: 'pet_plastic', objectType: 'bottle', destination: 'bottle_can',
    aliasesVi: ['chai nước ép', 'chai nước trái cây'], aliasesEn: ['juice bottle', 'plastic juice container'],
  },
  {
    code: 'glass_wine_bottle', nameVi: 'Chai rượu thủy tinh', nameEn: 'Glass wine bottle', material: 'glass', objectType: 'bottle', destination: 'bottle_can',
    aliasesVi: ['chai rượu', 'chai vang'], aliasesEn: ['wine bottle', 'glass wine container'],
  },
  {
    code: 'glass_sauce_bottle', nameVi: 'Chai sốt thủy tinh', nameEn: 'Glass sauce bottle', material: 'glass', objectType: 'bottle', destination: 'bottle_can',
    aliasesVi: ['chai tương', 'chai sốt'], aliasesEn: ['sauce bottle', 'glass condiment bottle'],
  },
  {
    code: 'glass_food_jar', nameVi: 'Hũ thực phẩm thủy tinh', nameEn: 'Glass food jar', material: 'glass', objectType: 'jar', destination: 'bottle_can',
    aliasesVi: ['hũ mứt', 'hũ thực phẩm'], aliasesEn: ['jam jar', 'food jar', 'glass preserve jar'],
  },
  {
    code: 'aluminium_food_tray', nameVi: 'Khay thực phẩm nhôm', nameEn: 'Aluminium food tray', material: 'aluminium', objectType: 'tray', destination: 'bottle_can',
    aliasesVi: ['khay nhôm', 'hộp nhôm'], aliasesEn: ['aluminum food tray', 'foil food tray'],
  },
  {
    code: 'aluminium_foil', nameVi: 'Giấy bạc nhôm', nameEn: 'Aluminium foil', material: 'aluminium', objectType: 'foil', destination: 'bottle_can',
    aliasesVi: ['giấy nhôm', 'màng nhôm'], aliasesEn: ['aluminum foil', 'tin foil'],
  },
  {
    code: 'steel_food_tray', nameVi: 'Khay thực phẩm thép', nameEn: 'Steel food tray', material: 'steel', objectType: 'tray', destination: 'bottle_can',
    aliasesVi: ['khay thép', 'khay kim loại'], aliasesEn: ['steel tray', 'metal food tray'],
  },
  {
    code: 'metal_jar_lid', nameVi: 'Nắp hũ kim loại', nameEn: 'Metal jar lid', material: 'steel', objectType: 'lid', destination: 'bottle_can',
    aliasesVi: ['nắp hũ sắt', 'nắp kim loại'], aliasesEn: ['metal lid', 'tin jar lid'],
  },
  {
    code: 'metal_bottle_cap', nameVi: 'Nắp chai kim loại', nameEn: 'Metal bottle cap', material: 'steel', objectType: 'cap', destination: 'bottle_can',
    aliasesVi: ['nắp chai sắt', 'nắp kim loại nhỏ'], aliasesEn: ['metal bottle cap', 'steel cap'],
  },
  {
    code: 'shampoo_bottle', nameVi: 'Chai dầu gội', nameEn: 'Shampoo bottle', material: 'rigid_plastic', objectType: 'bottle', destination: 'clean_plastic',
    aliasesVi: ['chai dầu gội đầu'], aliasesEn: ['shampoo container'],
  },
  {
    code: 'conditioner_bottle', nameVi: 'Chai dầu xả', nameEn: 'Conditioner bottle', material: 'rigid_plastic', objectType: 'bottle', destination: 'clean_plastic',
    aliasesVi: ['chai dầu xả tóc'], aliasesEn: ['conditioner container'],
  },
  {
    code: 'body_wash_bottle', nameVi: 'Chai sữa tắm', nameEn: 'Body wash bottle', material: 'rigid_plastic', objectType: 'bottle', destination: 'clean_plastic',
    aliasesVi: ['chai sữa tắm'], aliasesEn: ['shower gel bottle', 'body soap bottle'],
  },
  {
    code: 'hand_soap_bottle', nameVi: 'Chai nước rửa tay', nameEn: 'Hand soap bottle', material: 'rigid_plastic', objectType: 'bottle', destination: 'clean_plastic',
    aliasesVi: ['chai xà phòng rửa tay'], aliasesEn: ['liquid hand soap bottle'],
  },
  {
    code: 'detergent_bottle', nameVi: 'Chai nước giặt hoặc nước rửa', nameEn: 'Detergent bottle', material: 'rigid_plastic', objectType: 'bottle', destination: 'clean_plastic',
    aliasesVi: ['chai nước giặt', 'chai nước rửa chén'], aliasesEn: ['laundry detergent bottle', 'dish soap bottle'],
  },
  {
    code: 'cleaning_spray_bottle', nameVi: 'Chai xịt tẩy rửa rỗng', nameEn: 'Empty cleaning spray bottle', material: 'rigid_plastic', objectType: 'bottle', destination: 'clean_plastic',
    aliasesVi: ['chai xịt vệ sinh rỗng'], aliasesEn: ['cleaner spray bottle', 'empty household cleaner bottle'],
  },
  {
    code: 'yogurt_cup', nameVi: 'Hộp sữa chua', nameEn: 'Yogurt cup', material: 'rigid_plastic', objectType: 'cup', destination: 'clean_plastic',
    aliasesVi: ['cốc sữa chua', 'hộp yaourt'], aliasesEn: ['yoghurt pot', 'plastic yogurt container'],
  },
  {
    code: 'plastic_food_tray', nameVi: 'Khay thức ăn nhựa', nameEn: 'Plastic food tray', material: 'rigid_plastic', objectType: 'tray', destination: 'clean_plastic',
    aliasesVi: ['khay nhựa đựng thức ăn'], aliasesEn: ['plastic meal tray', 'food tray'],
  },
  {
    code: 'plastic_ice_cream_tub', nameVi: 'Hộp kem nhựa', nameEn: 'Plastic ice cream tub', material: 'rigid_plastic', objectType: 'container', destination: 'clean_plastic',
    aliasesVi: ['hộp kem'], aliasesEn: ['ice cream container', 'plastic ice cream box'],
  },
  {
    code: 'plastic_margarine_tub', nameVi: 'Hộp bơ thực vật nhựa', nameEn: 'Plastic margarine tub', material: 'rigid_plastic', objectType: 'container', destination: 'clean_plastic',
    aliasesVi: ['hộp bơ nhựa'], aliasesEn: ['butter tub', 'margarine container'],
  },
  {
    code: 'plastic_sauce_container', nameVi: 'Hộp sốt nhựa', nameEn: 'Plastic sauce container', material: 'rigid_plastic', objectType: 'container', destination: 'clean_plastic',
    aliasesVi: ['hộp tương ớt', 'hộp sốt nhựa'], aliasesEn: ['sauce tub', 'plastic condiment container'],
  },
  {
    code: 'plastic_clamshell', nameVi: 'Hộp nhựa nắp gập', nameEn: 'Plastic clamshell container', material: 'rigid_plastic', objectType: 'container', destination: 'clean_plastic',
    aliasesVi: ['hộp nhựa trong', 'hộp nắp gập'], aliasesEn: ['plastic clamshell', 'clear plastic container'],
  },
  {
    code: 'plastic_bread_bag', nameVi: 'Túi bánh mì nhựa', nameEn: 'Plastic bread bag', material: 'soft_plastic', objectType: 'bag', destination: 'clean_plastic',
    aliasesVi: ['bao bánh mì'], aliasesEn: ['bread packaging', 'plastic bread wrapper'],
  },
  {
    code: 'plastic_produce_bag', nameVi: 'Túi đựng rau quả nhựa', nameEn: 'Plastic produce bag', material: 'soft_plastic', objectType: 'bag', destination: 'clean_plastic',
    aliasesVi: ['túi rau quả', 'túi nilon đựng rau'], aliasesEn: ['produce bag', 'fruit and vegetable bag'],
  },
  {
    code: 'plastic_zip_bag', nameVi: 'Túi zip nhựa', nameEn: 'Plastic zip bag', material: 'soft_plastic', objectType: 'bag', destination: 'clean_plastic',
    aliasesVi: ['túi khóa kéo', 'túi zip'], aliasesEn: ['ziplock bag', 'resealable plastic bag'],
  },
  {
    code: 'bubble_wrap', nameVi: 'Màng xốp hơi', nameEn: 'Bubble wrap', material: 'soft_plastic', objectType: 'film', destination: 'clean_plastic',
    aliasesVi: ['xốp hơi', 'nilon bóng khí'], aliasesEn: ['air bubble packaging', 'bubble film'],
  },
  {
    code: 'plastic_egg_carton', nameVi: 'Khay trứng nhựa', nameEn: 'Plastic egg carton', material: 'rigid_plastic', objectType: 'tray', destination: 'clean_plastic',
    aliasesVi: ['vỉ trứng nhựa'], aliasesEn: ['plastic egg tray'],
  },
  {
    code: 'plastic_bottle_cap', nameVi: 'Nắp chai nhựa', nameEn: 'Plastic bottle cap', material: 'rigid_plastic', objectType: 'cap', destination: 'clean_plastic',
    aliasesVi: ['nắp chai nhựa'], aliasesEn: ['plastic cap', 'bottle lid'],
  },
  {
    code: 'plastic_container_lid', nameVi: 'Nắp hộp nhựa', nameEn: 'Plastic container lid', material: 'rigid_plastic', objectType: 'lid', destination: 'clean_plastic',
    aliasesVi: ['nắp hộp nhựa'], aliasesEn: ['plastic tub lid', 'food container lid'],
  },
  {
    code: 'plastic_plant_pot', nameVi: 'Chậu cây nhựa', nameEn: 'Plastic plant pot', material: 'rigid_plastic', objectType: 'pot', destination: 'clean_plastic',
    aliasesVi: ['chậu nhựa'], aliasesEn: ['plastic flower pot', 'plant pot'],
  },
  {
    code: 'book', nameVi: 'Sách', nameEn: 'Book', material: 'paper', objectType: 'book', destination: 'paper_cardboard',
    aliasesVi: ['sách giấy'], aliasesEn: ['paper book'],
  },
  {
    code: 'paperback_book', nameVi: 'Sách bìa mềm', nameEn: 'Paperback book', material: 'paper', objectType: 'book', destination: 'paper_cardboard',
    aliasesVi: ['truyện bìa mềm'], aliasesEn: ['softcover book'],
  },
  {
    code: 'paper_folder', nameVi: 'Bìa hồ sơ giấy', nameEn: 'Paper folder', material: 'paper', objectType: 'folder', destination: 'paper_cardboard',
    aliasesVi: ['bìa đựng hồ sơ'], aliasesEn: ['file folder', 'paper file folder'],
  },
  {
    code: 'paper_file', nameVi: 'Tập hồ sơ giấy', nameEn: 'Paper file', material: 'paper', objectType: 'document', destination: 'paper_cardboard',
    aliasesVi: ['hồ sơ giấy', 'tài liệu giấy'], aliasesEn: ['paper documents', 'paper records'],
  },
  {
    code: 'paper_calendar', nameVi: 'Lịch giấy', nameEn: 'Paper calendar', material: 'paper', objectType: 'paper', destination: 'paper_cardboard',
    aliasesVi: ['lịch treo tường giấy'], aliasesEn: ['calendar paper'],
  },
  {
    code: 'paper_gift_bag', nameVi: 'Túi quà giấy', nameEn: 'Paper gift bag', material: 'paper', objectType: 'bag', destination: 'paper_cardboard',
    aliasesVi: ['túi giấy quà tặng'], aliasesEn: ['gift paper bag'],
  },
  {
    code: 'paper_wrapping', nameVi: 'Giấy gói quà', nameEn: 'Paper wrapping', material: 'paper', objectType: 'paper', destination: 'paper_cardboard',
    aliasesVi: ['giấy gói'], aliasesEn: ['wrapping paper'],
  },
  {
    code: 'shredded_paper', nameVi: 'Giấy vụn', nameEn: 'Shredded paper', material: 'paper', objectType: 'paper', destination: 'paper_cardboard',
    aliasesVi: ['giấy xé vụn'], aliasesEn: ['shredded office paper'],
  },
  {
    code: 'paper_egg_carton', nameVi: 'Khay trứng giấy', nameEn: 'Paper egg carton', material: 'cardboard', objectType: 'tray', destination: 'paper_cardboard',
    aliasesVi: ['vỉ trứng giấy'], aliasesEn: ['cardboard egg carton', 'paper egg tray'],
  },
  {
    code: 'cereal_box', nameVi: 'Hộp ngũ cốc', nameEn: 'Cereal box', material: 'cardboard', objectType: 'box', destination: 'paper_cardboard',
    aliasesVi: ['hộp bánh ngũ cốc'], aliasesEn: ['breakfast cereal box'],
  },
  {
    code: 'tea_box', nameVi: 'Hộp trà giấy', nameEn: 'Tea box', material: 'cardboard', objectType: 'box', destination: 'paper_cardboard',
    aliasesVi: ['hộp trà'], aliasesEn: ['tea packaging', 'cardboard tea box'],
  },
  {
    code: 'shoe_box', nameVi: 'Hộp giày', nameEn: 'Shoe box', material: 'cardboard', objectType: 'box', destination: 'paper_cardboard',
    aliasesVi: ['hộp đựng giày'], aliasesEn: ['shoe packaging'],
  },
  {
    code: 'shipping_box', nameVi: 'Thùng giao hàng', nameEn: 'Shipping box', material: 'cardboard', objectType: 'box', destination: 'paper_cardboard',
    aliasesVi: ['thùng đóng hàng', 'thùng chuyển phát'], aliasesEn: ['delivery box', 'mailing box'],
  },
  {
    code: 'paper_mailer', nameVi: 'Phong bì vận chuyển giấy', nameEn: 'Paper mailer', material: 'paper', objectType: 'envelope', destination: 'paper_cardboard',
    aliasesVi: ['túi thư giấy'], aliasesEn: ['postal mailer', 'paper mailing envelope'],
  },
  {
    code: 'kraft_paper', nameVi: 'Giấy kraft', nameEn: 'Kraft paper', material: 'paper', objectType: 'paper', destination: 'paper_cardboard',
    aliasesVi: ['giấy nâu kraft'], aliasesEn: ['brown paper'],
  },
  {
    code: 'paper_flyer', nameVi: 'Tờ rơi giấy', nameEn: 'Paper flyer', material: 'paper', objectType: 'paper', destination: 'paper_cardboard',
    aliasesVi: ['tờ quảng cáo giấy'], aliasesEn: ['leaflet', 'paper leaflet'],
  },
  {
    code: 'paper_menu', nameVi: 'Thực đơn giấy', nameEn: 'Paper menu', material: 'paper', objectType: 'paper', destination: 'paper_cardboard',
    aliasesVi: ['menu giấy'], aliasesEn: ['restaurant menu'],
  },
  {
    code: 'paper_coffee_sleeve', nameVi: 'Ống bọc ly cà phê giấy', nameEn: 'Paper coffee sleeve', material: 'paper', objectType: 'sleeve', destination: 'paper_cardboard',
    aliasesVi: ['vòng bọc ly giấy'], aliasesEn: ['coffee cup sleeve', 'paper cup sleeve'],
  },
  {
    code: 'paper_bread_bag', nameVi: 'Túi bánh mì giấy', nameEn: 'Paper bread bag', material: 'paper', objectType: 'bag', destination: 'paper_cardboard',
    aliasesVi: ['bao bánh mì giấy'], aliasesEn: ['bread paper bag'],
  },
  {
    code: 'paper_document', nameVi: 'Tài liệu giấy', nameEn: 'Paper document', material: 'paper', objectType: 'document', destination: 'paper_cardboard',
    aliasesVi: ['giấy tờ', 'tài liệu'], aliasesEn: ['documents', 'office paper'],
  },
  {
    code: 'meat_scraps', nameVi: 'Thịt thừa', nameEn: 'Meat scraps', material: 'organic', objectType: 'food', destination: 'organic',
    aliasesVi: ['thịt thừa', 'thịt bỏ đi'], aliasesEn: ['meat waste', 'leftover meat'],
  },
  {
    code: 'fish_scraps', nameVi: 'Cá thừa', nameEn: 'Fish scraps', material: 'organic', objectType: 'food', destination: 'organic',
    aliasesVi: ['cá thừa', 'đầu cá'], aliasesEn: ['fish waste', 'leftover fish'],
  },
  {
    code: 'poultry_bones', nameVi: 'Xương gia cầm', nameEn: 'Poultry bones', material: 'organic', objectType: 'food', destination: 'organic',
    aliasesVi: ['xương gà', 'xương vịt'], aliasesEn: ['chicken bones', 'bird bones'],
  },
  {
    code: 'animal_bones', nameVi: 'Xương động vật', nameEn: 'Animal bones', material: 'organic', objectType: 'food', destination: 'organic',
    aliasesVi: ['xương heo', 'xương bò'], aliasesEn: ['food bones', 'meat bones'],
  },
  {
    code: 'seafood_shells', nameVi: 'Vỏ hải sản', nameEn: 'Seafood shells', material: 'organic', objectType: 'food', destination: 'organic',
    aliasesVi: ['vỏ tôm', 'vỏ cua', 'vỏ sò'], aliasesEn: ['shrimp shells', 'crab shells', 'shellfish shells'],
  },
  {
    code: 'bread_waste', nameVi: 'Bánh mì thừa', nameEn: 'Bread waste', material: 'organic', objectType: 'food', destination: 'organic',
    aliasesVi: ['bánh mì mốc', 'bánh mì bỏ đi'], aliasesEn: ['stale bread', 'bread scraps'],
  },
  {
    code: 'cake_waste', nameVi: 'Bánh ngọt thừa', nameEn: 'Cake waste', material: 'organic', objectType: 'food', destination: 'organic',
    aliasesVi: ['bánh ngọt thừa'], aliasesEn: ['leftover cake', 'pastry waste'],
  },
  {
    code: 'dairy_food_waste', nameVi: 'Thực phẩm từ sữa thừa', nameEn: 'Dairy food waste', material: 'organic', objectType: 'food', destination: 'organic',
    aliasesVi: ['sữa chua thừa', 'phô mai thừa'], aliasesEn: ['dairy waste', 'leftover dairy'],
  },
  {
    code: 'spoiled_food', nameVi: 'Thực phẩm hỏng', nameEn: 'Spoiled food', material: 'organic', objectType: 'food', destination: 'organic',
    aliasesVi: ['đồ ăn hỏng', 'thức ăn ôi'], aliasesEn: ['rotten food', 'expired food waste'],
  },
  {
    code: 'fruit_core', nameVi: 'Lõi và hạt trái cây', nameEn: 'Fruit core', material: 'organic', objectType: 'food', destination: 'organic',
    aliasesVi: ['lõi táo', 'hạt trái cây'], aliasesEn: ['apple core', 'fruit seeds'],
  },
  {
    code: 'vegetable_stems', nameVi: 'Cuống rau củ', nameEn: 'Vegetable stems', material: 'organic', objectType: 'food', destination: 'organic',
    aliasesVi: ['cuống rau', 'thân rau'], aliasesEn: ['vegetable stalks', 'vegetable stems'],
  },
  {
    code: 'tea_leaves', nameVi: 'Bã trà rời', nameEn: 'Tea leaves', material: 'organic', objectType: 'food', destination: 'organic',
    aliasesVi: ['bã trà', 'lá trà đã dùng'], aliasesEn: ['used tea leaves', 'loose tea waste'],
  },
  {
    code: 'coffee_filter', nameVi: 'Bã cà phê kèm giấy lọc', nameEn: 'Coffee filter and grounds', material: 'organic', objectType: 'food', destination: 'organic',
    aliasesVi: ['phin cà phê', 'giấy lọc cà phê'], aliasesEn: ['used coffee filter', 'coffee filter waste'],
  },
  {
    code: 'garden_leaves', nameVi: 'Lá cây', nameEn: 'Garden leaves', material: 'organic', objectType: 'garden', destination: 'organic',
    aliasesVi: ['lá khô', 'lá cây rụng'], aliasesEn: ['fallen leaves', 'dry leaves'],
  },
  {
    code: 'cut_flowers', nameVi: 'Hoa và cành cây', nameEn: 'Cut flowers and stems', material: 'organic', objectType: 'garden', destination: 'organic',
    aliasesVi: ['hoa héo', 'cành hoa'], aliasesEn: ['wilted flowers', 'flower stems'],
  },
  {
    code: 'grass_clippings', nameVi: 'Cỏ cắt bỏ', nameEn: 'Grass clippings', material: 'organic', objectType: 'garden', destination: 'organic',
    aliasesVi: ['cỏ vụn', 'cỏ cắt'], aliasesEn: ['cut grass', 'grass waste'],
  },
  {
    code: 'pet_food_waste', nameVi: 'Thức ăn thú nuôi thừa', nameEn: 'Pet food waste', material: 'organic', objectType: 'food', destination: 'organic',
    aliasesVi: ['thức ăn chó mèo thừa'], aliasesEn: ['leftover pet food', 'dog food waste'],
  },
  {
    code: 'cotton_bud', nameVi: 'Tăm bông', nameEn: 'Cotton bud', material: 'mixed_material', objectType: 'hygiene', destination: 'landfill',
    aliasesVi: ['bông ngoáy tai'], aliasesEn: ['cotton swab', 'earbud'],
  },
  {
    code: 'cotton_pad', nameVi: 'Bông tẩy trang', nameEn: 'Cotton pad', material: 'mixed_material', objectType: 'hygiene', destination: 'landfill',
    aliasesVi: ['miếng bông tẩy trang'], aliasesEn: ['makeup cotton pad'],
  },
  {
    code: 'wet_wipe', nameVi: 'Khăn ướt', nameEn: 'Wet wipe', material: 'mixed_material', objectType: 'hygiene', destination: 'landfill',
    aliasesVi: ['giấy ướt', 'khăn lau ướt'], aliasesEn: ['wet tissue', 'cleaning wipe'],
  },
  {
    code: 'makeup_wipe', nameVi: 'Khăn lau trang điểm', nameEn: 'Makeup wipe', material: 'mixed_material', objectType: 'hygiene', destination: 'landfill',
    aliasesVi: ['khăn tẩy trang'], aliasesEn: ['facial cleansing wipe'],
  },
  {
    code: 'dental_floss', nameVi: 'Chỉ nha khoa', nameEn: 'Dental floss', material: 'mixed_plastic', objectType: 'hygiene', destination: 'landfill',
    aliasesVi: ['tơ nha khoa'], aliasesEn: ['floss'],
  },
  {
    code: 'disposable_razor', nameVi: 'Dao cạo dùng một lần', nameEn: 'Disposable razor', material: 'mixed_material', objectType: 'hygiene', destination: 'landfill',
    aliasesVi: ['dao cạo râu'], aliasesEn: ['razor', 'single-use razor'],
  },
  {
    code: 'sponge', nameVi: 'Miếng bọt biển', nameEn: 'Sponge', material: 'mixed_plastic', objectType: 'cleaning', destination: 'landfill',
    aliasesVi: ['mút rửa bát', 'bọt biển'], aliasesEn: ['dish sponge', 'cleaning sponge'],
  },
  {
    code: 'rubber_glove', nameVi: 'Găng tay cao su', nameEn: 'Rubber glove', material: 'mixed_material', objectType: 'glove', destination: 'landfill',
    aliasesVi: ['găng tay cao su dùng một lần'], aliasesEn: ['rubber gloves', 'household glove'],
  },
  {
    code: 'latex_glove', nameVi: 'Găng tay latex', nameEn: 'Latex glove', material: 'mixed_material', objectType: 'glove', destination: 'landfill',
    aliasesVi: ['găng tay y tế'], aliasesEn: ['disposable latex glove', 'medical glove'],
  },
  {
    code: 'rubber_band', nameVi: 'Dây chun', nameEn: 'Rubber band', material: 'mixed_material', objectType: 'accessory', destination: 'landfill',
    aliasesVi: ['dây thun'], aliasesEn: ['elastic band'],
  },
  {
    code: 'eraser', nameVi: 'Cục tẩy', nameEn: 'Eraser', material: 'mixed_material', objectType: 'stationery', destination: 'landfill',
    aliasesVi: ['gôm tẩy'], aliasesEn: ['rubber eraser'],
  },
  {
    code: 'plastic_toy', nameVi: 'Đồ chơi nhựa', nameEn: 'Plastic toy', material: 'mixed_plastic', objectType: 'toy', destination: 'landfill',
    aliasesVi: ['đồ chơi bằng nhựa'], aliasesEn: ['plastic children toy'],
  },
  {
    code: 'broken_toy', nameVi: 'Đồ chơi hỏng', nameEn: 'Broken toy', material: 'mixed_material', objectType: 'toy', destination: 'landfill',
    aliasesVi: ['đồ chơi vỡ', 'đồ chơi hỏng'], aliasesEn: ['damaged toy'],
  },
  {
    code: 'cd_dvd', nameVi: 'Đĩa CD hoặc DVD', nameEn: 'CD or DVD', material: 'mixed_plastic', objectType: 'media', destination: 'landfill',
    aliasesVi: ['đĩa quang', 'đĩa CD'], aliasesEn: ['disc', 'optical disc'],
  },
  {
    code: 'cassette_tape', nameVi: 'Băng cassette', nameEn: 'Cassette tape', material: 'mixed_plastic', objectType: 'media', destination: 'landfill',
    aliasesVi: ['băng từ'], aliasesEn: ['audio cassette', 'magnetic tape'],
  },
  {
    code: 'nylon_stocking', nameVi: 'Tất nylon', nameEn: 'Nylon stocking', material: 'mixed_plastic', objectType: 'textile', destination: 'landfill',
    aliasesVi: ['vớ nylon', 'quần tất'], aliasesEn: ['pantyhose', 'nylon tights'],
  },
  {
    code: 'shoe', nameVi: 'Giày dép cũ', nameEn: 'Worn shoes', material: 'mixed_material', objectType: 'textile', destination: 'landfill',
    aliasesVi: ['giày cũ', 'dép cũ'], aliasesEn: ['old shoes', 'worn footwear'],
  },
  {
    code: 'worn_clothing', nameVi: 'Quần áo cũ', nameEn: 'Worn clothing', material: 'mixed_material', objectType: 'textile', destination: 'landfill',
    aliasesVi: ['quần áo bỏ đi', 'vải cũ'], aliasesEn: ['old clothes', 'worn textile'],
  },
  {
    code: 'pillow', nameVi: 'Gối cũ', nameEn: 'Old pillow', material: 'mixed_material', objectType: 'textile', destination: 'landfill',
    aliasesVi: ['ruột gối cũ'], aliasesEn: ['used pillow'],
  },
  {
    code: 'laminated_pouch', nameVi: 'Túi bao bì nhiều lớp', nameEn: 'Laminated pouch', material: 'mixed_plastic', objectType: 'pouch', destination: 'landfill',
    aliasesVi: ['gói nhiều lớp', 'túi bạc'], aliasesEn: ['multilayer pouch', 'foil pouch'],
  },
  {
    code: 'waxed_paper', nameVi: 'Giấy phủ sáp', nameEn: 'Waxed paper', material: 'mixed_material', objectType: 'paper', destination: 'landfill',
    aliasesVi: ['giấy chống thấm'], aliasesEn: ['wax paper', 'coated paper'],
  },
  {
    code: 'sticker_sheet', nameVi: 'Tờ sticker', nameEn: 'Sticker sheet', material: 'mixed_material', objectType: 'paper', destination: 'landfill',
    aliasesVi: ['nhãn dán'], aliasesEn: ['adhesive labels', 'sticker paper'],
  },
  {
    code: 'wallpaper', nameVi: 'Giấy dán tường', nameEn: 'Wallpaper', material: 'mixed_material', objectType: 'paper', destination: 'landfill',
    aliasesVi: ['tấm dán tường'], aliasesEn: ['wall covering'],
  },
  {
    code: 'photo_print', nameVi: 'Ảnh in', nameEn: 'Photo print', material: 'mixed_material', objectType: 'paper', destination: 'landfill',
    aliasesVi: ['ảnh giấy', 'hình in'], aliasesEn: ['printed photograph', 'photo paper'],
  },
  {
    code: 'chewing_gum', nameVi: 'Kẹo cao su', nameEn: 'Chewing gum', material: 'mixed_material', objectType: 'food', destination: 'landfill',
    aliasesVi: ['kẹo gum'], aliasesEn: ['gum'],
  },
  {
    code: 'plastic_hanger', nameVi: 'Móc áo nhựa', nameEn: 'Plastic hanger', material: 'mixed_plastic', objectType: 'hanger', destination: 'landfill',
    aliasesVi: ['móc quần áo nhựa'], aliasesEn: ['clothes hanger', 'plastic clothes hanger'],
  },
  {
    code: 'broken_umbrella', nameVi: 'Ô hoặc dù hỏng', nameEn: 'Broken umbrella', material: 'mixed_material', objectType: 'household', destination: 'landfill',
    aliasesVi: ['dù hỏng', 'ô hỏng'], aliasesEn: ['damaged umbrella'],
  },
  {
    code: 'pet_hair', nameVi: 'Lông thú nuôi', nameEn: 'Pet hair', material: 'mixed_material', objectType: 'pet_waste', destination: 'landfill',
    aliasesVi: ['lông chó mèo'], aliasesEn: ['dog hair', 'cat hair'],
  },
  {
    code: 'vacuum_bag', nameVi: 'Túi máy hút bụi', nameEn: 'Vacuum cleaner bag', material: 'mixed_material', objectType: 'cleaning', destination: 'landfill',
    aliasesVi: ['túi hút bụi'], aliasesEn: ['vacuum bag', 'dust bag'],
  },
  {
    code: 'disposable_plastic_plate', nameVi: 'Đĩa nhựa dùng một lần', nameEn: 'Disposable plastic plate', material: 'mixed_plastic', objectType: 'plate', destination: 'landfill',
    aliasesVi: ['dĩa nhựa dùng một lần'], aliasesEn: ['plastic disposable plate'],
  },
  {
    code: 'disposable_plastic_bowl', nameVi: 'Tô nhựa dùng một lần', nameEn: 'Disposable plastic bowl', material: 'mixed_plastic', objectType: 'bowl', destination: 'landfill',
    aliasesVi: ['bát nhựa dùng một lần'], aliasesEn: ['plastic disposable bowl'],
  },
  {
    code: 'laptop', nameVi: 'Máy tính xách tay', nameEn: 'Laptop', material: 'electronic', objectType: 'device', destination: 'special_handling',
    aliasesVi: ['laptop', 'máy tính xách tay'], aliasesEn: ['notebook computer'],
  },
  {
    code: 'tablet', nameVi: 'Máy tính bảng', nameEn: 'Tablet', material: 'electronic', objectType: 'device', destination: 'special_handling',
    aliasesVi: ['tablet', 'máy tính bảng'], aliasesEn: ['tablet computer'],
  },
  {
    code: 'keyboard', nameVi: 'Bàn phím', nameEn: 'Keyboard', material: 'electronic', objectType: 'device', destination: 'special_handling',
    aliasesVi: ['bàn phím máy tính'], aliasesEn: ['computer keyboard'],
  },
  {
    code: 'computer_mouse', nameVi: 'Chuột máy tính', nameEn: 'Computer mouse', material: 'electronic', objectType: 'device', destination: 'special_handling',
    aliasesVi: ['chuột máy tính'], aliasesEn: ['computer mouse'],
  },
  {
    code: 'headphones', nameVi: 'Tai nghe', nameEn: 'Headphones', material: 'electronic', objectType: 'device', destination: 'special_handling',
    aliasesVi: ['tai nghe có dây', 'tai nghe bluetooth'], aliasesEn: ['earphones', 'headset'],
  },
  {
    code: 'charger', nameVi: 'Củ sạc', nameEn: 'Charger', material: 'electronic', objectType: 'accessory', destination: 'special_handling',
    aliasesVi: ['củ sạc điện thoại'], aliasesEn: ['phone charger', 'charging brick'],
  },
  {
    code: 'power_adapter', nameVi: 'Bộ chuyển nguồn', nameEn: 'Power adapter', material: 'electronic', objectType: 'accessory', destination: 'special_handling',
    aliasesVi: ['adapter điện'], aliasesEn: ['AC adapter', 'power brick'],
  },
  {
    code: 'extension_cord', nameVi: 'Ổ cắm nối dài', nameEn: 'Extension cord', material: 'electronic', objectType: 'cable', destination: 'special_handling',
    aliasesVi: ['dây nối điện', 'ổ điện kéo dài'], aliasesEn: ['extension lead', 'power strip cord'],
  },
  {
    code: 'remote_control', nameVi: 'Điều khiển từ xa', nameEn: 'Remote control', material: 'electronic', objectType: 'device', destination: 'special_handling',
    aliasesVi: ['remote', 'điều khiển'], aliasesEn: ['remote', 'TV remote'],
  },
  {
    code: 'digital_camera', nameVi: 'Máy ảnh kỹ thuật số', nameEn: 'Digital camera', material: 'electronic', objectType: 'device', destination: 'special_handling',
    aliasesVi: ['máy ảnh số'], aliasesEn: ['camera', 'digital photo camera'],
  },
  {
    code: 'printer', nameVi: 'Máy in', nameEn: 'Printer', material: 'electronic', objectType: 'device', destination: 'special_handling',
    aliasesVi: ['máy in cũ'], aliasesEn: ['home printer'],
  },
  {
    code: 'printer_cartridge', nameVi: 'Hộp mực máy in', nameEn: 'Printer cartridge', material: 'mixed_material', objectType: 'cartridge', destination: 'special_handling',
    aliasesVi: ['cartridge máy in', 'hộp mực'], aliasesEn: ['ink cartridge', 'toner cartridge'],
  },
  {
    code: 'ink_cartridge', nameVi: 'Lọ mực máy in', nameEn: 'Ink cartridge', material: 'hazardous', objectType: 'cartridge', destination: 'special_handling',
    aliasesVi: ['mực in', 'lọ mực'], aliasesEn: ['printer ink', 'ink container'],
  },
  {
    code: 'smoke_detector', nameVi: 'Thiết bị báo khói', nameEn: 'Smoke detector', material: 'electronic', objectType: 'device', destination: 'special_handling',
    aliasesVi: ['báo cháy', 'cảm biến khói'], aliasesEn: ['smoke alarm'],
  },
  {
    code: 'fire_extinguisher', nameVi: 'Bình chữa cháy', nameEn: 'Fire extinguisher', material: 'hazardous', objectType: 'pressurised', destination: 'special_handling',
    aliasesVi: ['bình cứu hỏa'], aliasesEn: ['fire extinguisher cylinder'],
  },
  {
    code: 'propane_canister', nameVi: 'Bình gas mini', nameEn: 'Propane canister', material: 'hazardous', objectType: 'pressurised', destination: 'special_handling',
    aliasesVi: ['bình gas nhỏ', 'lon gas mini'], aliasesEn: ['butane canister', 'gas cartridge'],
  },
  {
    code: 'nail_polish', nameVi: 'Lọ sơn móng tay', nameEn: 'Nail polish', material: 'hazardous', objectType: 'container', destination: 'special_handling',
    aliasesVi: ['sơn móng tay'], aliasesEn: ['nail varnish', 'nail polish bottle'],
  },
  {
    code: 'nail_polish_remover', nameVi: 'Dung dịch tẩy sơn móng', nameEn: 'Nail polish remover', material: 'hazardous', objectType: 'container', destination: 'special_handling',
    aliasesVi: ['nước tẩy móng'], aliasesEn: ['acetone', 'acetone bottle'],
  },
  {
    code: 'mercury_thermometer', nameVi: 'Nhiệt kế thủy ngân', nameEn: 'Mercury thermometer', material: 'hazardous', objectType: 'medical', destination: 'special_handling',
    aliasesVi: ['nhiệt kế thủy ngân'], aliasesEn: ['mercury temperature gauge'],
  },
  {
    code: 'fluorescent_tube', nameVi: 'Ống đèn huỳnh quang', nameEn: 'Fluorescent tube', material: 'hazardous', objectType: 'bulb', destination: 'special_handling',
    aliasesVi: ['bóng tuýp', 'đèn huỳnh quang dài'], aliasesEn: ['fluorescent lamp', 'fluorescent light tube'],
  },
  {
    code: 'bleach_container', nameVi: 'Bao bì thuốc tẩy', nameEn: 'Bleach container', material: 'hazardous', objectType: 'container', destination: 'special_handling',
    aliasesVi: ['chai nước tẩy'], aliasesEn: ['bleach bottle', 'chlorine cleaner container'],
  },
  {
    code: 'drain_cleaner_container', nameVi: 'Bao bì chất thông cống', nameEn: 'Drain cleaner container', material: 'hazardous', objectType: 'container', destination: 'special_handling',
    aliasesVi: ['chai thông cống'], aliasesEn: ['drain opener bottle', 'caustic cleaner container'],
  },
  {
    code: 'paint_thinner_container', nameVi: 'Bao bì dung môi pha sơn', nameEn: 'Paint thinner container', material: 'hazardous', objectType: 'container', destination: 'special_handling',
    aliasesVi: ['chai dung môi', 'thùng xăng thơm'], aliasesEn: ['solvent container', 'thinner can'],
  },
  {
    code: 'e_cigarette', nameVi: 'Thuốc lá điện tử', nameEn: 'Electronic cigarette', material: 'electronic', objectType: 'device', destination: 'special_handling',
    aliasesVi: ['vape', 'pod'], aliasesEn: ['vape', 'vaping device'],
  },
]

const expandedWasteItems = expandedItemSpecs.map((spec) => item(
  spec.code,
  spec.nameVi,
  spec.nameEn,
  spec.material,
  spec.objectType,
  categoryForBin(spec.destination),
  spec.destination === 'special_handling',
  spec.destination === 'special_handling',
  spec.aliasesVi ?? [],
  spec.aliasesEn ?? [],
))

export const siteProfiles: SiteProfile[] = [
  {
    code: 'default_station',
    nameVi: 'Trạm phân loại mẫu',
    nameEn: 'Default sorting station',
    country: 'Vietnam',
    city: 'Ho Chi Minh City',
    descriptionVi: 'Hướng dẫn phân loại rác cho trạm thùng rác đã chọn.',
    descriptionEn: 'Waste sorting guidance for the selected waste station.',
    isActive: true,
  },
]

export const bins: Bin[] = [
  {
    code: 'bottle_can',
    nameVi: 'Chai & Lon',
    nameEn: 'Bottle & Can',
    colorName: 'Orange',
    colorHex: '#f08c21',
    iconKey: 'bottle',
    descriptionVi: 'Chai nhựa rỗng, lon nhôm và chai được chấp nhận.',
    descriptionEn: 'Empty plastic drink bottles, aluminium cans and accepted bottles.',
    sortOrder: 1,
    isActive: true,
  },
  {
    code: 'organic',
    nameVi: 'Chất Thải Hữu Cơ',
    nameEn: 'Organic Waste',
    colorName: 'Green',
    colorHex: '#b4b534',
    iconKey: 'leaf',
    descriptionVi: 'Thức ăn thừa, vỏ trái cây và chất lỏng được chấp nhận.',
    descriptionEn: 'Leftover food, fruit peels and accepted liquids.',
    sortOrder: 2,
    isActive: true,
  },
  {
    code: 'clean_plastic',
    nameVi: 'Nhựa Sạch',
    nameEn: 'Clean Plastic',
    colorName: 'Red',
    colorHex: '#bd5961',
    iconKey: 'cup',
    descriptionVi: 'Ly nhựa sạch, hộp nhựa sạch, túi nhựa sạch và bao bì sạch.',
    descriptionEn: 'Clean plastic cups, containers, bags, snack packaging and clean foam.',
    sortOrder: 3,
    isActive: true,
  },
  {
    code: 'paper_cardboard',
    nameVi: 'Giấy & Bìa Carton',
    nameEn: 'Paper & Cardboard',
    colorName: 'Blue',
    colorHex: '#6698cc',
    iconKey: 'paper',
    descriptionVi: 'Giấy, túi giấy và bìa carton sạch, khô.',
    descriptionEn: 'Clean and dry paper, cardboard and paper bags.',
    sortOrder: 4,
    isActive: true,
  },
  {
    code: 'landfill',
    nameVi: 'Chất Thải Chôn Lấp',
    nameEn: 'Landfill',
    colorName: 'Brown',
    colorHex: '#673c33',
    iconKey: 'landfill',
    descriptionVi: 'Nhựa bẩn, ly giấy, khăn giấy và bao bì nhiễm bẩn.',
    descriptionEn: 'Dirty plastic, paper cups, tissues, napkins and contaminated packaging.',
    sortOrder: 5,
    isActive: true,
  },
  {
    code: 'special_handling',
    nameVi: 'Xử Lý Riêng',
    nameEn: 'Hazardous',
    colorName: 'Yellow',
    colorHex: '#f4d68c',
    iconKey: 'alert',
    descriptionVi: 'Vật phẩm cần điểm thu gom được phê duyệt hoặc hướng dẫn từ nhân viên phụ trách.',
    descriptionEn: 'Items that need an approved collection point or guidance from responsible staff.',
    sortOrder: 6,
    isActive: true,
  },
  {
    code: 'mixed_uncertain',
    nameVi: 'Hỗn Hợp / Chưa Chắc Chắn',
    nameEn: 'Mixed or Uncertain',
    colorName: 'Neutral',
    colorHex: '#77716a',
    iconKey: 'help',
    descriptionVi: 'Không chọn thùng cho đến khi xác định được vật phẩm hoặc vật liệu chính xác hơn.',
    descriptionEn: 'No bin is selected until the item or its material can be identified more precisely.',
    sortOrder: 7,
    isActive: true,
  },
]

export const materials: Material[] = [
  material('pet_plastic', 'Nhựa PET', 'PET plastic'),
  material('rigid_plastic', 'Nhựa cứng', 'Rigid plastic'),
  material('soft_plastic', 'Nhựa mềm', 'Soft plastic'),
  material('mixed_plastic', 'Nhựa hỗn hợp', 'Mixed plastic'),
  material('aluminium', 'Nhôm', 'Aluminium'),
  material('steel', 'Thép', 'Steel'),
  material('glass', 'Thủy tinh', 'Glass'),
  material('paper', 'Giấy', 'Paper'),
  material('cardboard', 'Bìa carton', 'Cardboard'),
  material('organic', 'Hữu cơ', 'Organic'),
  material('mixed_material', 'Vật liệu hỗn hợp', 'Mixed material'),
  material('wood', 'Gỗ', 'Wood'),
  material('electronic', 'Điện tử', 'Electronic'),
  material('hazardous', 'Nguy hại', 'Hazardous'),
  material('unknown', 'Chưa xác định', 'Unknown'),
]

export const wasteItems: WasteItem[] = [
  item('plastic_water_bottle', 'Chai nước nhựa', 'Plastic water bottle', 'pet_plastic', 'bottle', 'Bottle & Can', false, false, [
    'chai nhựa',
    'chai nước',
    'chai PET',
  ], ['water bottle', 'pet bottle', 'plastic drink bottle']),
  item('plastic_soft_drink_bottle', 'Chai nước ngọt nhựa', 'Plastic soft-drink bottle', 'pet_plastic', 'bottle', 'Bottle & Can', false, false, [
    'chai nước ngọt',
    'chai coca',
    'chai pepsi',
  ], ['soft drink bottle', 'soda bottle', 'plastic soda bottle']),
  item('aluminium_drink_can', 'Lon nước nhôm', 'Aluminium drink can', 'aluminium', 'can', 'Bottle & Can', false, false, [
    'lon nhôm',
    'lon nước',
    'lon coca',
  ], ['aluminium can', 'aluminum can', 'drink can']),
  item('steel_food_can', 'Lon thực phẩm thép', 'Steel food can', 'steel', 'can', 'Bottle & Can', false, false, [
    'lon đồ hộp',
    'hộp thiếc',
    'lon thép',
  ], ['steel can', 'food can', 'tin can']),
  item('glass_drink_bottle', 'Chai thủy tinh', 'Glass drink bottle', 'glass', 'bottle', 'Bottle & Can', false, false, [
    'chai thủy tinh',
    'chai bia',
    'chai nước thủy tinh',
  ], ['glass bottle', 'drink bottle', 'beer bottle']),
  item('plastic_takeaway_cup', 'Ly nhựa mang đi', 'Plastic takeaway cup', 'rigid_plastic', 'cup', 'Clean Plastic', false, false, [
    'ly nhựa',
    'cốc nhựa',
    'ly trà sữa',
  ], ['plastic cup', 'takeaway cup', 'iced drink cup']),
  item('plastic_cup_lid', 'Nắp ly nhựa', 'Plastic cup lid', 'rigid_plastic', 'lid', 'Clean Plastic', false, false, [
    'nắp ly',
    'nắp cốc',
    'nắp nhựa',
  ], ['plastic lid', 'cup lid', 'drink lid']),
  item('plastic_straw', 'Ống hút nhựa', 'Plastic straw', 'mixed_plastic', 'straw', 'Clean Plastic', false, false, [
    'ống hút',
    'ống hút nhựa',
  ], ['straw', 'plastic straw']),
  item('plastic_food_container', 'Hộp nhựa đựng thức ăn', 'Plastic food container', 'rigid_plastic', 'container', 'Clean Plastic', false, false, [
    'hộp nhựa',
    'hộp cơm nhựa',
    'hộp thức ăn',
  ], ['plastic food container', 'food container', 'takeaway container']),
  item('plastic_cosmetic_container', 'Hộp đựng mỹ phẩm', 'Cosmetic container', 'mixed_material', 'container', 'Landfill', false, false, [
    'hộp đựng mỹ phẩm',
    'bao bì mỹ phẩm',
    'lọ mỹ phẩm',
    'tuýp mỹ phẩm',
  ], ['cosmetic container', 'cosmetic packaging', 'cosmetic jar', 'cosmetic tube', 'makeup container']),
  item('eye_drop_container', 'Lọ thuốc nhỏ mắt', 'Eye-drop container', 'hazardous', 'container', 'Special Handling', true, true, [
    'lọ thuốc nhỏ mắt',
    'chai thuốc nhỏ mắt',
    'vỏ thuốc nhỏ mắt',
  ], ['eye-drop bottle', 'eye drop container', 'ophthalmic bottle']),
  item('topical_cream_container', 'Tuýp kem bôi', 'Topical cream container', 'hazardous', 'container', 'Special Handling', true, true, [
    'tuýp kem bôi',
    'tuýp thuốc bôi',
    'hộp kem bôi',
  ], ['cream tube', 'topical cream tube', 'ointment tube']),
  item('medicine_bottle', 'Lọ thuốc', 'Medicine bottle', 'hazardous', 'container', 'Special Handling', true, true, [
    'lọ thuốc',
    'chai thuốc',
    'vỏ lọ thuốc',
  ], ['medicine bottle', 'pill bottle', 'medication container']),
  item('glass_jar', 'Lọ thủy tinh', 'Glass jar', 'glass', 'jar', 'Bottle & Can', false, false, [
    'lọ thủy tinh',
    'hũ thủy tinh',
    'chai lọ thủy tinh',
  ], ['glass jar', 'glass food jar', 'jam jar']),
  item('plastic_takeaway_box', 'Hộp nhựa mang đi', 'Plastic takeaway box', 'rigid_plastic', 'container', 'Clean Plastic', false, false, [
    'hộp mang đi',
    'hộp nhựa takeaway',
  ], ['plastic takeaway box', 'takeout box', 'takeaway box']),
  item('plastic_bag', 'Túi nhựa', 'Plastic bag', 'soft_plastic', 'bag', 'Clean Plastic', false, false, [
    'túi nhựa',
    'bao ni lông',
  ], ['plastic bag', 'carrier bag', 'shopping bag']),
  item('plastic_wrapping_film', 'Màng bọc nhựa', 'Plastic wrapping film', 'soft_plastic', 'film', 'Clean Plastic', false, false, [
    'màng bọc nhựa',
    'màng nhựa',
    'nilon bọc đồ ăn',
  ], ['plastic wrapping film', 'cling film', 'plastic film']),
  item('clean_plastic_bag', 'Túi nhựa sạch', 'Clean plastic bag', 'soft_plastic', 'bag', 'Clean Plastic', false, false, [
    'túi nhựa sạch',
    'bao ni lông sạch',
  ], ['clean plastic bag', 'clean bag', 'plastic bag clean']),
  item('dirty_plastic_bag', 'Túi nhựa bẩn', 'Dirty plastic bag', 'soft_plastic', 'bag', 'Landfill', false, false, [
    'túi nhựa bẩn',
    'bao ni lông bẩn',
  ], ['dirty plastic bag', 'contaminated bag']),
  item('snack_wrapper', 'Vỏ gói snack', 'Snack wrapper', 'mixed_plastic', 'wrapper', 'Clean Plastic', false, false, [
    'vỏ bánh',
    'bao bì snack',
    'vỏ snack',
  ], ['snack wrapper', 'chip bag', 'crisp packet']),
  item('instant_noodle_packaging', 'Bao bì mì ăn liền', 'Instant noodle packaging', 'mixed_plastic', 'wrapper', 'Clean Plastic', false, false, [
    'gói mì',
    'bao mì',
    'vỏ mì ăn liền',
  ], ['instant noodle packaging', 'noodle packet', 'ramen wrapper']),
  item('clean_styrofoam_container', 'Hộp xốp sạch', 'Clean styrofoam container', 'mixed_plastic', 'foam', 'Clean Plastic', false, false, [
    'hộp xốp sạch',
    'xốp sạch',
  ], ['clean styrofoam', 'clean foam container']),
  item('styrofoam_container', 'Hộp xốp', 'Styrofoam container', 'mixed_plastic', 'foam', 'Clean Plastic', false, false, [
    'hộp xốp',
    'hộp foam',
  ], ['styrofoam container', 'foam food box', 'foam container']),
  item('dirty_styrofoam_container', 'Hộp xốp bẩn', 'Dirty styrofoam container', 'mixed_plastic', 'foam', 'Landfill', false, false, [
    'hộp xốp bẩn',
    'xốp bẩn',
  ], ['dirty styrofoam', 'dirty foam container']),
  item('printing_paper', 'Giấy in', 'Printing paper', 'paper', 'paper', 'Paper & Cardboard', false, false, [
    'giấy in',
    'giấy a4',
  ], ['printing paper', 'copy paper', 'a4 paper']),
  item('notebook_paper', 'Giấy vở', 'Notebook paper', 'paper', 'paper', 'Paper & Cardboard', false, false, [
    'giấy vở',
    'vở cũ',
  ], ['notebook paper', 'loose leaf paper']),
  item('newspaper', 'Báo giấy', 'Newspaper', 'paper', 'paper', 'Paper & Cardboard', false, false, [
    'báo',
    'báo giấy',
  ], ['newspaper', 'newsprint']),
  item('magazine', 'Tạp chí', 'Magazine', 'paper', 'paper', 'Paper & Cardboard', false, false, [
    'tạp chí',
    'sách báo',
  ], ['magazine', 'catalogue']),
  item('paper_bag', 'Túi giấy', 'Paper bag', 'paper', 'bag', 'Paper & Cardboard', false, false, [
    'túi giấy',
    'bao giấy',
  ], ['paper bag', 'kraft bag']),
  item('envelope', 'Phong bì giấy', 'Paper envelope', 'paper', 'paper', 'Paper & Cardboard', false, false, [
    'phong bì',
    'bao thư',
  ], ['envelope', 'paper envelope', 'mail envelope']),
  item('paperboard_packaging', 'Hộp giấy mỏng', 'Paperboard packaging', 'cardboard', 'box', 'Paper & Cardboard', false, false, [
    'hộp giấy',
    'bìa giấy mỏng',
    'bao thuốc lá',
    'vỏ bao thuốc lá',
    'hộp thuốc lá',
  ], ['paperboard packaging', 'cereal box', 'paperboard box', 'cigarette pack', 'cigarette box', 'tobacco pack']),
  item('cardboard_box', 'Thùng carton', 'Cardboard box', 'cardboard', 'box', 'Paper & Cardboard', false, false, [
    'thùng carton',
    'bìa carton',
    'hộp carton',
  ], ['cardboard box', 'carton box', 'box']),
  item('cardboard_tube', 'Lõi giấy carton', 'Cardboard tube', 'cardboard', 'tube', 'Paper & Cardboard', false, false, [
    'lõi giấy',
    'lõi cuộn giấy',
    'ống carton',
  ], ['cardboard tube', 'paper towel roll', 'toilet roll tube']),
  item('pizza_box', 'Hộp pizza', 'Pizza box', 'cardboard', 'box', 'Paper & Cardboard', false, false, [
    'hộp pizza',
    'hộp bánh pizza',
  ], ['pizza box', 'takeaway pizza box']),
  item('paper_cup', 'Ly giấy', 'Paper cup', 'mixed_material', 'cup', 'Landfill', false, false, [
    'ly giấy',
    'cốc giấy',
    'ly cà phê giấy',
  ], ['paper cup', 'takeaway coffee cup', 'coffee cup']),
  item('drink_carton', 'Hộp đồ uống nhiều lớp', 'Drink carton', 'mixed_material', 'box', 'Paper & Cardboard', false, false, [
    'hộp sữa',
    'hộp nước trái cây',
    'hộp giấy nhiều lớp',
  ], ['drink carton', 'milk carton', 'juice carton']),
  item('paper_plate', 'Đĩa giấy', 'Paper plate', 'mixed_material', 'paper', 'Landfill', false, false, [
    'đĩa giấy',
    'dĩa giấy',
  ], ['paper plate', 'disposable paper plate']),
  item('receipt', 'Hóa đơn giấy', 'Receipt', 'mixed_material', 'paper', 'Landfill', false, false, [
    'hóa đơn',
    'giấy in nhiệt',
  ], ['receipt', 'thermal receipt', 'till receipt']),
  item('tissue', 'Khăn giấy', 'Tissue', 'paper', 'paper', 'Landfill', false, false, [
    'khăn giấy',
    'giấy lau',
  ], ['tissue', 'facial tissue']),
  item('hair_clip', 'Kẹp tóc', 'Hair clip', 'mixed_plastic', 'accessory', 'Landfill', false, false, [
    'kẹp tóc',
    'càng cua tóc',
    'ghim tóc',
  ], ['hair clip', 'hair claw', 'barrette']),
  item('hair_tie', 'Dây buộc tóc', 'Hair tie', 'mixed_material', 'accessory', 'Landfill', false, false, [
    'dây buộc tóc',
    'thun buộc tóc',
    'scrunchie',
  ], ['hair tie', 'hair elastic', 'scrunchie']),
  item('pen_marker', 'Bút và bút đánh dấu', 'Pen and marker', 'mixed_material', 'stationery', 'Landfill', false, false, [
    'bút',
    'bút bi',
    'bút dạ',
    'bút highlight',
  ], ['pen', 'ballpoint pen', 'marker', 'highlighter']),
  item('phone_case', 'Ốp điện thoại', 'Phone case', 'mixed_plastic', 'accessory', 'Landfill', false, false, [
    'ốp điện thoại',
    'ốp lưng',
    'vỏ điện thoại',
  ], ['phone case', 'mobile phone cover', 'smartphone case']),
  item('paper_napkin', 'Khăn ăn giấy', 'Paper napkin', 'paper', 'paper', 'Landfill', false, false, [
    'khăn ăn',
    'khăn giấy ăn',
  ], ['paper napkin', 'napkin']),
  item('paper_towel', 'Khăn giấy lau', 'Paper towel', 'paper', 'paper', 'Landfill', false, false, [
    'khăn giấy lau',
    'giấy lau bếp',
  ], ['paper towel', 'kitchen towel', 'used paper towel']),
  item('food_waste', 'Thức ăn thừa', 'Food waste', 'organic', 'food', 'Organic Waste', false, false, [
    'đồ ăn thừa',
    'thức ăn thừa',
  ], ['food waste', 'leftover food']),
  item('leftover_rice', 'Cơm thừa', 'Leftover rice', 'organic', 'food', 'Organic Waste', false, false, [
    'cơm thừa',
    'cơm dư',
  ], ['leftover rice', 'rice waste']),
  item('leftover_noodles', 'Mì thừa', 'Leftover noodles', 'organic', 'food', 'Organic Waste', false, false, [
    'mì thừa',
    'bún thừa',
    'phở thừa',
  ], ['leftover noodles', 'noodle waste']),
  item('fruit_peel', 'Vỏ trái cây', 'Fruit peel', 'organic', 'food', 'Organic Waste', false, false, [
    'vỏ trái cây',
    'vỏ chuối',
    'vỏ cam',
  ], ['fruit peel', 'banana peel', 'orange peel']),
  item('vegetable_scraps', 'Rau củ thừa', 'Vegetable scraps', 'organic', 'food', 'Organic Waste', false, false, [
    'rau thừa',
    'vỏ rau củ',
    'cuống rau',
  ], ['vegetable scraps', 'vegetable peel', 'food scraps']),
  item('egg_shell', 'Vỏ trứng', 'Egg shell', 'organic', 'food', 'Organic Waste', false, false, [
    'vỏ trứng',
    'trứng vỡ',
  ], ['egg shell', 'eggshell']),
  item('coffee_grounds', 'Bã cà phê', 'Coffee grounds', 'organic', 'food', 'Organic Waste', false, false, [
    'bã cà phê',
    'cặn cà phê',
  ], ['coffee grounds', 'coffee waste']),
  item('tea_bag', 'Túi trà', 'Tea bag', 'mixed_material', 'food', 'Organic Waste', false, false, [
    'túi trà',
    'bã trà',
  ], ['tea bag', 'used tea bag']),
  item('leftover_drink', 'Đồ uống thừa', 'Leftover drink', 'organic', 'liquid', 'Organic Waste', false, false, [
    'nước thừa',
    'đồ uống thừa',
  ], ['leftover drink', 'remaining liquid']),
  item('cat_waste', 'Phân mèo hoặc cát vệ sinh', 'Cat waste or litter', 'mixed_material', 'pet_waste', 'Landfill', false, false, [
    'phân mèo',
    'cát vệ sinh mèo',
    'chất thải vật nuôi',
  ], ['cat faeces', 'cat feces', 'cat litter', 'pet waste']),
  item('milk_tea_cup', 'Ly trà sữa', 'Milk tea cup', 'rigid_plastic', 'cup', 'Clean Plastic', false, false, [
    'trà sữa',
    'ly trà sữa',
  ], ['milk tea cup', 'bubble tea cup', 'boba cup']),
  item('plastic_spoon', 'Muỗng nhựa', 'Plastic spoon', 'mixed_plastic', 'utensil', 'Landfill', false, false, [
    'muỗng nhựa',
    'thìa nhựa',
  ], ['plastic spoon', 'disposable spoon']),
  item('plastic_fork', 'Nĩa nhựa', 'Plastic fork', 'mixed_plastic', 'utensil', 'Landfill', false, false, [
    'nĩa nhựa',
    'dĩa nhựa',
  ], ['plastic fork', 'disposable fork']),
  item('disposable_cutlery', 'Dụng cụ dùng một lần', 'Disposable cutlery', 'mixed_material', 'utensil', 'Landfill', false, false, [
    'dụng cụ dùng một lần',
    'dao nĩa muỗng nhựa',
    'muỗng nĩa nhựa dùng một lần',
    'đũa dùng một lần',
  ], ['disposable cutlery', 'plastic cutlery', 'plastic spoon', 'plastic fork', 'plastic knife', 'disposable chopsticks', 'bamboo chopsticks']),
  item('wooden_utensil', 'Dụng cụ gỗ dùng một lần', 'Wooden utensil', 'wood', 'utensil', 'Landfill', false, false, [
    'muỗng gỗ',
    'đũa gỗ',
    'dụng cụ gỗ',
  ], ['wooden utensil', 'wooden spoon', 'wooden fork']),
  item('toothpaste_tube', 'Tuýp kem đánh răng', 'Toothpaste tube', 'mixed_plastic', 'tube', 'Landfill', false, false, [
    'tuýp kem đánh răng',
    'vỏ kem đánh răng',
  ], ['toothpaste tube', 'toothpaste packaging']),
  item('toothbrush', 'Bàn chải đánh răng', 'Toothbrush', 'mixed_plastic', 'hygiene', 'Landfill', false, false, [
    'bàn chải đánh răng',
  ], ['toothbrush']),
  item('ceramic_item', 'Đồ gốm sứ', 'Ceramic item', 'mixed_material', 'ceramic', 'Landfill', false, false, [
    'đồ gốm',
    'đồ sứ',
    'bát đĩa sứ',
  ], ['ceramic', 'ceramic item', 'pottery']),
  item('battery', 'Pin', 'Battery', 'hazardous', 'battery', 'Special Handling', true, true, [
    'pin',
    'pin tiểu',
    'pin sạc',
  ], ['battery', 'aa battery', 'rechargeable battery']),
  item('mobile_phone', 'Điện thoại di động', 'Mobile phone', 'electronic', 'device', 'Special Handling', true, true, [
    'điện thoại',
    'điện thoại cũ',
  ], ['mobile phone', 'phone', 'smartphone']),
  item('electronic_cable', 'Dây cáp điện tử', 'Electronic cable', 'electronic', 'cable', 'Special Handling', true, true, [
    'dây cáp',
    'cáp sạc',
    'dây điện tử',
  ], ['electronic cable', 'charging cable', 'usb cable']),
  item('broken_glass', 'Thủy tinh vỡ', 'Broken glass', 'glass', 'glass', 'Special Handling', true, true, [
    'kính vỡ',
    'thủy tinh vỡ',
    'mảnh chai vỡ',
  ], ['broken glass', 'glass shard', 'shattered glass']),
  item('light_bulb', 'Bóng đèn', 'Light bulb', 'hazardous', 'bulb', 'Special Handling', true, true, [
    'bóng đèn',
    'đèn huỳnh quang',
  ], ['light bulb', 'fluorescent bulb', 'lamp bulb']),
  item('chemical_container', 'Bao bì hóa chất', 'Chemical container', 'hazardous', 'container', 'Special Handling', true, true, [
    'chai hóa chất',
    'hộp hóa chất',
    'bao bì hóa chất',
  ], ['chemical container', 'chemical bottle', 'hazard container']),
  item('paint_container', 'Thùng sơn', 'Paint container', 'hazardous', 'container', 'Special Handling', true, true, [
    'thùng sơn',
    'lon sơn',
    'hộp sơn',
  ], ['paint container', 'paint can', 'paint tin']),
  item('pesticide_container', 'Bao bì thuốc trừ sâu', 'Pesticide container', 'hazardous', 'container', 'Special Handling', true, true, [
    'chai thuốc trừ sâu',
    'bao bì thuốc bảo vệ thực vật',
    'hộp thuốc trừ sâu',
  ], ['pesticide container', 'pesticide bottle', 'insecticide container']),
  item('aerosol_can', 'Bình xịt', 'Aerosol can', 'hazardous', 'can', 'Special Handling', true, true, [
    'bình xịt',
    'lon xịt',
  ], ['aerosol can', 'spray can', 'pressurised can']),
  item('medicine_blister_pack', 'Vỏ thuốc rỗng', 'Empty medicine packaging', 'mixed_material', 'packaging', 'Landfill', false, false, [
    'vỉ thuốc',
    'bao bì thuốc',
    'gói thuốc rỗng',
    'vỏ thuốc rỗng',
  ], ['medicine blister pack', 'pill blister', 'tablet pack', 'empty medicine sachet', 'empty medicine packaging']),
  item('loose_medicine', 'Thuốc không sử dụng', 'Unused medicine', 'hazardous', 'small_waste', 'Special Handling', true, true, [
    'thuốc thừa',
    'thuốc hết hạn',
    'viên thuốc',
  ], ['unused medicine', 'expired medicine', 'loose pills']),
  item('used_syringe', 'Kim tiêm đã sử dụng', 'Used syringe', 'hazardous', 'small_waste', 'Special Handling', true, true, [
    'kim tiêm',
    'ống tiêm',
    'bơm kim tiêm',
  ], ['used syringe', 'syringe', 'medical needle']),
  item('power_bank', 'Pin sạc dự phòng', 'Power bank', 'electronic', 'device', 'Special Handling', true, true, [
    'sạc dự phòng',
    'pin dự phòng',
  ], ['power bank', 'portable charger', 'battery pack']),
  item('small_e_waste', 'Rác điện tử nhỏ', 'Small e-waste', 'electronic', 'device', 'Special Handling', true, true, [
    'rác điện tử',
    'thiết bị điện tử cũ',
    'đồ điện tử hỏng',
  ], ['e-waste', 'electronic waste', 'small electronics']),
  item('medical_mask', 'Khẩu trang y tế', 'Medical mask', 'mixed_material', 'mask', 'Landfill', false, false, [
    'khẩu trang',
    'khẩu trang y tế',
  ], ['medical mask', 'face mask', 'disposable mask']),
  item('disposable_diaper', 'Tã dùng một lần', 'Disposable diaper', 'mixed_material', 'hygiene', 'Landfill', false, false, [
    'tã',
    'bỉm',
  ], ['diaper', 'nappy', 'disposable diaper']),
  item('sanitary_pad', 'Băng vệ sinh', 'Sanitary pad', 'mixed_material', 'hygiene', 'Landfill', false, false, [
    'băng vệ sinh',
  ], ['sanitary pad', 'period pad']),
  item('cigarette_butt', 'Đầu lọc thuốc lá', 'Cigarette butt', 'mixed_material', 'small_waste', 'Landfill', false, false, [
    'đầu lọc thuốc lá',
    'mẩu thuốc lá',
  ], ['cigarette butt', 'cigarette filter']),
  ...expandedWasteItems,
  item('unknown', 'Vật phẩm chưa xác định', 'Unknown item', 'unknown', 'unknown', 'Unknown', false, false, [
    'không rõ',
    'vật lạ',
  ], ['unknown item', 'unknown waste']),
]

export const conditionQuestions: ConditionQuestion[] = [
  ...['plastic_water_bottle', 'plastic_soft_drink_bottle', 'plastic_milk_bottle', 'plastic_juice_bottle', 'aluminium_drink_can', 'glass_drink_bottle', 'glass_jar', 'glass_wine_bottle', 'glass_sauce_bottle', 'glass_food_jar'].map(
    (itemCode) => ({
      itemCode,
      questionKey: 'container_state',
      questionVi: 'Vật phẩm có còn chất lỏng bên trong không?',
      questionEn: 'Does the item still contain liquid?',
      options: [
        option('empty', 'Không, đã rỗng', 'No, it is empty'),
        option('contains_liquid', 'Có, còn chất lỏng', 'Yes, it contains liquid'),
      ],
      sortOrder: 1,
      isActive: true,
    }),
  ),
  ...['plastic_takeaway_cup', 'milk_tea_cup'].map((itemCode) => ({
    itemCode,
    questionKey: 'plastic_cup_condition',
    questionVi: 'Ly đang ở tình trạng nào?',
    questionEn: 'What is the condition of the cup?',
    options: [
      option('clean_empty', 'Sạch và rỗng', 'Clean and empty'),
      option('contains_food_liquid', 'Còn thức ăn hoặc chất lỏng', 'Contains food or liquid'),
      option('empty_dirty_cleanable', 'Bẩn nhưng có thể rửa sạch', 'Empty but can be rinsed clean'),
      option('cannot_clean', 'Không thể làm sạch', 'Cannot be cleaned'),
    ],
    sortOrder: 1,
    isActive: true,
  })),
  ...['plastic_food_container', 'plastic_takeaway_box'].map((itemCode) => ({
    itemCode,
    questionKey: 'container_condition',
    questionVi: 'Hộp đang ở tình trạng nào?',
    questionEn: 'What is the condition of the container?',
    options: [
      option('clean_empty', 'Sạch và rỗng', 'Clean and empty'),
      option('contains_food_liquid', 'Còn thức ăn', 'Contains leftover food'),
      option('empty_dirty_cleanable', 'Bẩn nhưng có thể rửa sạch', 'Empty but can be cleaned'),
      option('cannot_clean', 'Không thể làm sạch', 'Cannot be cleaned'),
    ],
    sortOrder: 1,
    isActive: true,
  })),
  ...['plastic_cup_lid', 'plastic_straw', 'snack_wrapper', 'instant_noodle_packaging', 'clean_styrofoam_container', 'plastic_bag', 'plastic_wrapping_film', 'styrofoam_container', 'shampoo_bottle', 'conditioner_bottle', 'body_wash_bottle', 'hand_soap_bottle', 'detergent_bottle', 'cleaning_spray_bottle', 'yogurt_cup', 'plastic_food_tray', 'plastic_ice_cream_tub', 'plastic_margarine_tub', 'plastic_sauce_container', 'plastic_clamshell', 'plastic_bread_bag', 'plastic_produce_bag', 'plastic_zip_bag', 'bubble_wrap', 'plastic_egg_carton', 'plastic_bottle_cap', 'plastic_container_lid', 'plastic_plant_pot'].map(
    (itemCode) => ({
      itemCode,
      questionKey: 'plastic_cleanliness',
      questionVi: 'Vật phẩm có sạch và không còn thức ăn không?',
      questionEn: 'Is the item clean and free from food residue?',
      options: [
        option('clean', 'Sạch', 'Clean'),
        option('dirty', 'Bẩn hoặc dính thức ăn', 'Dirty or contaminated'),
      ],
      sortOrder: 1,
      isActive: true,
    }),
  ),
  ...[
    'printing_paper',
    'notebook_paper',
    'newspaper',
    'magazine',
    'paper_bag',
    'envelope',
    'paperboard_packaging',
    'cardboard_box',
    'cardboard_tube',
    'pizza_box',
    'book',
    'paperback_book',
    'paper_folder',
    'paper_file',
    'paper_calendar',
    'paper_gift_bag',
    'paper_wrapping',
    'shredded_paper',
    'paper_egg_carton',
    'cereal_box',
    'tea_box',
    'shoe_box',
    'shipping_box',
    'paper_mailer',
    'kraft_paper',
    'paper_flyer',
    'paper_menu',
    'paper_coffee_sleeve',
    'paper_bread_bag',
    'paper_document',
  ].map((itemCode) => ({
    itemCode,
    questionKey: 'paper_condition',
    questionVi: 'Vật phẩm có sạch và khô không?',
    questionEn: 'Is the item clean and dry?',
    options: [
      option('clean_dry', 'Sạch và khô', 'Yes, clean and dry'),
      option('wet', 'Bị ướt', 'Wet'),
      option('greasy', 'Dính dầu mỡ hoặc bẩn', 'Greasy or contaminated'),
      option('partly_greasy', 'Chỉ bẩn một phần', 'Partly greasy'),
    ],
    sortOrder: 1,
    isActive: true,
  })),
]

const foodFromPlastic: ComponentAction[] = [
  component('remaining_liquid', 'Thức ăn hoặc chất lỏng', 'Food or liquid', 'organic', {
    materialVi: 'Thức ăn / chất lỏng',
    materialEn: 'Food / liquid',
  }),
  component('container', 'Phần nhựa đã rửa sạch', 'Cleaned plastic item', 'clean_plastic', {
    materialVi: 'Nhựa',
    materialEn: 'Plastic',
  }),
]

const plasticCupComponents: ComponentAction[] = [
  component('cup', 'Ly', 'Cup', 'clean_plastic', {
    materialVi: 'Nhựa',
    materialEn: 'Plastic',
    disposalNoteVi: 'Nhựa Sạch',
    disposalNoteEn: 'Clean Plastic',
  }),
  component('lid', 'Nắp', 'Lid', 'clean_plastic', {
    materialVi: 'Nhựa',
    materialEn: 'Plastic',
    disposalNoteVi: 'Kiểm tra quy định tái chế tại điểm bỏ rác',
    disposalNoteEn: 'Check local recycling rules',
  }),
  component('straw', 'Ống hút', 'Straw', 'landfill', {
    materialVi: 'Nhựa',
    materialEn: 'Plastic',
    disposalNoteVi: 'Chất Thải Chôn Lấp',
    disposalNoteEn: 'Landfill',
  }),
  component('paper_sleeve', 'Ống bọc giấy', 'Paper sleeve', 'paper_cardboard', {
    materialVi: 'Giấy',
    materialEn: 'Paper',
    disposalNoteVi: 'Giấy & Bìa Carton',
    disposalNoteEn: 'Paper & Cardboard',
  }),
]

const splitPizzaBox: ComponentAction[] = [
  component('clean_section', 'Phần giấy sạch và khô', 'Clean and dry section', 'paper_cardboard'),
  component('greasy_section', 'Phần dính dầu mỡ', 'Greasy section', 'landfill'),
]

const paperCupComponents: ComponentAction[] = [
  component('remaining_liquid', 'Chất lỏng còn lại', 'Remaining liquid', 'organic', {
    materialVi: 'Chất lỏng',
    materialEn: 'Liquid',
  }),
  component('paper_cup_body', 'Thân ly', 'Cup body', 'landfill', {
    materialVi: 'Giấy có lớp phủ',
    materialEn: 'Lined paper',
  }),
  component('lid', 'Nắp nhựa', 'Plastic lid', 'clean_plastic', {
    materialVi: 'Nhựa',
    materialEn: 'Plastic',
  }),
  component('straw', 'Ống hút', 'Straw', 'landfill', {
    materialVi: 'Nhựa',
    materialEn: 'Plastic',
    disposalNoteVi: 'Chất Thải Chôn Lấp',
    disposalNoteEn: 'Landfill',
  }),
]

const drinkCartonComponents: ComponentAction[] = [
  component('remaining_liquid', 'Chất lỏng còn lại', 'Remaining liquid', 'organic', {
    materialVi: 'Chất lỏng',
    materialEn: 'Liquid',
  }),
  component('carton_body', 'Thân hộp', 'Carton body', 'paper_cardboard', {
    materialVi: 'Giấy ghép nhiều lớp',
    materialEn: 'Paper composite',
  }),
  component('plastic_cap', 'Nắp nhựa', 'Plastic cap', 'clean_plastic', {
    materialVi: 'Nhựa',
    materialEn: 'Plastic',
  }),
]

export const disposalRules: DisposalRule[] = [
  ...containerToBottleCanRules('plastic_water_bottle', 'chai nhựa', 'plastic bottle'),
  ...containerToBottleCanRules('plastic_soft_drink_bottle', 'chai nước ngọt', 'soft-drink bottle'),
  ...containerToBottleCanRules('aluminium_drink_can', 'lon nhôm', 'aluminium can'),
  ...containerToBottleCanRules('glass_drink_bottle', 'chai thủy tinh', 'glass bottle'),
  ...containerToBottleCanRules('glass_jar', 'lọ thủy tinh', 'glass jar'),
  ...containerToBottleCanRules('plastic_milk_bottle', 'chai sữa nhựa', 'plastic milk bottle'),
  ...containerToBottleCanRules('plastic_juice_bottle', 'chai nước trái cây nhựa', 'plastic juice bottle'),
  ...containerToBottleCanRules('glass_wine_bottle', 'chai rượu thủy tinh', 'glass wine bottle'),
  ...containerToBottleCanRules('glass_sauce_bottle', 'chai sốt thủy tinh', 'glass sauce bottle'),
  ...containerToBottleCanRules('glass_food_jar', 'hũ thực phẩm thủy tinh', 'glass food jar'),
  ...defaultRules(['aluminium_food_tray', 'aluminium_foil', 'steel_food_tray', 'metal_jar_lid', 'metal_bottle_cap'], 'bottle_can', {
    vi: 'Làm sạch phần còn lại nếu có thể, sau đó đặt vật kim loại vào Chai & Lon.',
    en: 'Remove residue when possible, then place the metal item in Bottle & Can.',
    stepsVi: ['Loại bỏ thức ăn hoặc chất lỏng còn lại.', 'Làm sạch nếu có thể.', 'Đặt vào Chai & Lon.'],
    stepsEn: ['Remove remaining food or liquid.', 'Clean it when possible.', 'Place it in Bottle & Can.'],
  }),
  rule('steel_food_can', 'default', 'bottle_can', {
    vi: 'Làm rỗng lon, sau đó đặt vào thùng Chai & Lon.',
    en: 'Empty the can, then place it in Bottle & Can.',
    stepsVi: ['Đổ bỏ phần còn lại.', 'Làm sạch thức ăn bám nếu có thể.', 'Đặt lon vào Chai & Lon.'],
    stepsEn: ['Remove remaining contents.', 'Rinse food residue when possible.', 'Place the can in Bottle & Can.'],
  }),
  ...plasticCupRules('plastic_takeaway_cup', 'ly nhựa', 'plastic cup'),
  ...plasticCupRules('milk_tea_cup', 'ly trà sữa', 'milk tea cup'),
  ...plasticContainerRules('plastic_food_container', 'hộp nhựa', 'plastic food container'),
  ...plasticContainerRules('plastic_takeaway_box', 'hộp nhựa mang đi', 'plastic takeaway box'),
  rule('plastic_cosmetic_container', 'default', 'landfill', {
    vi: 'Đặt hộp đựng mỹ phẩm vào Chất Thải Chôn Lấp.',
    en: 'Place the cosmetic container in Landfill.',
    stepsVi: [
      'Đậy kín hộp, lọ hoặc tuýp và không đổ phần mỹ phẩm còn lại xuống bồn rửa.',
      'Đặt hộp đựng mỹ phẩm vào Chất Thải Chôn Lấp.',
    ],
    stepsEn: [
      'Close the container and do not pour leftover product down the drain.',
      'Place the cosmetic container in Landfill.',
    ],
    whyVi: 'Hộp đựng mỹ phẩm thường còn cặn và có thể gồm nhiều phần như thân, nắp hoặc vòi bơm nên không nên mặc định đưa vào luồng Nhựa Sạch.',
    whyEn: 'Cosmetic containers often retain product residue and may combine parts such as a body, cap, or pump, so they should not automatically enter the Clean Plastic stream.',
    warningVi: 'Nếu đây là bao bì thuốc, hóa chất hoặc bình xịt, hãy dùng điểm thu gom xử lý riêng thay vì thùng rác thường.',
    warningEn: 'If this is medicine, chemical, or aerosol packaging, use a special collection point instead of a general waste bin.',
  }),
  ...cleanPlasticRules(['plastic_cup_lid', 'plastic_straw']),
  ...cleanPlasticRules(['snack_wrapper', 'instant_noodle_packaging', 'clean_styrofoam_container', 'plastic_bag', 'plastic_wrapping_film', 'styrofoam_container']),
  ...cleanPlasticRules(['shampoo_bottle', 'conditioner_bottle', 'body_wash_bottle', 'hand_soap_bottle', 'detergent_bottle', 'cleaning_spray_bottle', 'yogurt_cup', 'plastic_food_tray', 'plastic_ice_cream_tub', 'plastic_margarine_tub', 'plastic_sauce_container', 'plastic_clamshell', 'plastic_bread_bag', 'plastic_produce_bag', 'plastic_zip_bag', 'bubble_wrap', 'plastic_egg_carton', 'plastic_bottle_cap', 'plastic_container_lid', 'plastic_plant_pot']),
  rule('clean_plastic_bag', 'default', 'clean_plastic', {
    vi: 'Đặt túi nhựa sạch vào thùng Nhựa Sạch.',
    en: 'Place the clean plastic bag in Clean Plastic.',
    stepsVi: ['Lắc bỏ vụn thức ăn nếu có.', 'Đặt túi vào Nhựa Sạch.'],
    stepsEn: ['Shake out any crumbs.', 'Place the bag in Clean Plastic.'],
  }),
  rule('dirty_plastic_bag', 'default', 'landfill', {
    vi: 'Đặt túi nhựa bẩn vào thùng Chất Thải Chôn Lấp.',
    en: 'Place the dirty plastic bag in Landfill.',
    stepsVi: ['Không bỏ vào Nhựa Sạch nếu còn bẩn.', 'Đặt vào Chất Thải Chôn Lấp.'],
    stepsEn: ['Do not place it in Clean Plastic if contaminated.', 'Place it in Landfill.'],
    warningVi: 'Nếu túi có thể rửa sạch và làm khô, hãy dùng luồng tìm kiếm cho túi nhựa sạch.',
    warningEn: 'If the bag can be cleaned and dried, search for clean plastic bag instead.',
  }),
  rule('dirty_styrofoam_container', 'default', 'landfill', {
    vi: 'Đặt hộp xốp bẩn vào thùng Chất Thải Chôn Lấp.',
    en: 'Place the dirty styrofoam container in Landfill.',
    stepsVi: ['Đổ bỏ thức ăn còn lại.', 'Đặt hộp bẩn vào Chất Thải Chôn Lấp.'],
    stepsEn: ['Remove remaining food.', 'Place the dirty container in Landfill.'],
  }),
  ...paperRules([
    'printing_paper',
    'notebook_paper',
    'newspaper',
    'magazine',
    'paper_bag',
    'envelope',
    'paperboard_packaging',
    'cardboard_box',
    'cardboard_tube',
  ]),
  ...paperRules(['pizza_box'], true),
  ...paperRules(['book', 'paperback_book', 'paper_folder', 'paper_file', 'paper_calendar', 'paper_gift_bag', 'paper_wrapping', 'shredded_paper', 'paper_egg_carton', 'cereal_box', 'tea_box', 'shoe_box', 'shipping_box', 'paper_mailer', 'kraft_paper', 'paper_flyer', 'paper_menu', 'paper_coffee_sleeve', 'paper_bread_bag', 'paper_document']),
  rule('paper_cup', 'default', 'landfill', {
    vi: 'Đổ chất lỏng còn lại vào Hữu Cơ, sau đó bỏ ly giấy vào Chất Thải Chôn Lấp.',
    en: 'Empty remaining liquid into Organic Waste, then place the paper cup in Landfill.',
    stepsVi: ['Đổ chất lỏng còn lại.', 'Tháo nắp và ống hút khỏi ly.', 'Đặt thân ly giấy vào Chất Thải Chôn Lấp.'],
    stepsEn: ['Empty remaining liquid.', 'Remove the lid and straw from the cup.', 'Place the paper cup body in Landfill.'],
    components: paperCupComponents,
    stepComponentCodes: [
      ['remaining_liquid'],
      ['lid', 'straw'],
      ['paper_cup_body'],
    ],
    warningVi: 'Ly giấy thường có lớp phủ và không thuộc nhóm giấy sạch.',
    warningEn: 'Paper cups usually have a lining and are not clean paper.',
  }),
  rule('drink_carton', 'default', 'paper_cardboard', {
    vi: 'Làm rỗng, tráng sạch và để khô hộp trước khi đặt vào Giấy & Bìa Carton.',
    en: 'Empty, rinse and dry the carton before placing it in Paper & Cardboard.',
    stepsVi: ['Đổ hết chất lỏng còn lại.', 'Tráng sạch hộp.', 'Để hộp ráo và khô.', 'Đặt vào Giấy & Bìa Carton.'],
    stepsEn: ['Empty any remaining liquid.', 'Rinse the carton.', 'Let it drain and dry.', 'Place it in Paper & Cardboard.'],
    components: drinkCartonComponents,
    stepComponentCodes: [
      ['remaining_liquid'],
      ['carton_body'],
      ['carton_body', 'plastic_cap'],
      ['carton_body', 'plastic_cap'],
    ],
    warningVi: 'Hộp đồ uống có nhiều lớp vật liệu; chỉ bỏ hộp rỗng, sạch và khô vào dòng này.',
    warningEn: 'Drink cartons contain multiple material layers; use this stream only for empty, clean and dry cartons.',
  }),
  ...defaultRules(['tissue', 'hair_clip', 'hair_tie', 'pen_marker', 'phone_case', 'paper_napkin', 'paper_towel', 'wooden_utensil', 'toothpaste_tube', 'toothbrush', 'ceramic_item', 'plastic_spoon', 'plastic_fork', 'disposable_cutlery', 'medical_mask', 'paper_plate', 'receipt', 'disposable_diaper', 'sanitary_pad', 'cigarette_butt', 'cat_waste'], 'landfill', {
    vi: 'Đặt vật phẩm này vào thùng Chất Thải Chôn Lấp.',
    en: 'Place this item in Landfill.',
    stepsVi: ['Không bỏ vào thùng tái chế.', 'Đặt vào Chất Thải Chôn Lấp.'],
    stepsEn: ['Do not place it in a recycling bin.', 'Place it in Landfill.'],
  }),
  ...defaultRules(['cotton_bud', 'cotton_pad', 'wet_wipe', 'makeup_wipe', 'dental_floss', 'disposable_razor', 'sponge', 'rubber_glove', 'latex_glove', 'rubber_band', 'eraser', 'plastic_toy', 'broken_toy', 'cd_dvd', 'cassette_tape', 'nylon_stocking', 'shoe', 'worn_clothing', 'pillow', 'laminated_pouch', 'waxed_paper', 'sticker_sheet', 'wallpaper', 'photo_print', 'chewing_gum', 'plastic_hanger', 'broken_umbrella', 'pet_hair', 'vacuum_bag', 'disposable_plastic_plate', 'disposable_plastic_bowl'], 'landfill', {
    vi: 'Đặt vật phẩm này vào thùng Chất Thải Chôn Lấp.',
    en: 'Place this item in Landfill.',
    stepsVi: ['Không bỏ vào thùng tái chế.', 'Đặt vào Chất Thải Chôn Lấp.'],
    stepsEn: ['Do not place it in a recycling bin.', 'Place it in Landfill.'],
  }),
  rule('medicine_blister_pack', 'default', 'landfill', {
    vi: 'Đặt vỏ thuốc rỗng vào thùng Chất Thải Chôn Lấp.',
    en: 'Place empty medicine packaging in Landfill.',
    stepsVi: ['Kiểm tra để chắc chắn vỏ không còn thuốc.', 'Đặt vỏ thuốc rỗng vào Chất Thải Chôn Lấp.'],
    stepsEn: ['Make sure no medicine remains in the packaging.', 'Place the empty packaging in Landfill.'],
    warningVi: 'Nếu còn thuốc hoặc thuốc đã hết hạn, không bỏ vào Landfill; hãy dùng điểm thu gom thuốc phù hợp.',
    warningEn: 'If medicine remains or has expired, do not use Landfill; use an appropriate medicine collection point.',
  }),
  ...defaultRules(
    ['food_waste', 'leftover_rice', 'leftover_noodles', 'fruit_peel', 'vegetable_scraps', 'egg_shell', 'coffee_grounds', 'tea_bag', 'leftover_drink', 'meat_scraps', 'fish_scraps', 'poultry_bones', 'animal_bones', 'seafood_shells', 'bread_waste', 'cake_waste', 'dairy_food_waste', 'spoiled_food', 'fruit_core', 'vegetable_stems', 'tea_leaves', 'coffee_filter', 'garden_leaves', 'cut_flowers', 'grass_clippings', 'pet_food_waste'],
    'organic',
    {
      vi: 'Đặt phần hữu cơ vào thùng Chất Thải Hữu Cơ.',
      en: 'Place the organic material in Organic Waste.',
      stepsVi: ['Tách bỏ bao bì không phải hữu cơ.', 'Đặt phần thức ăn hoặc chất lỏng vào Hữu Cơ.'],
      stepsEn: ['Remove any non-organic packaging.', 'Place the food or liquid in Organic Waste.'],
      warningVi: 'Bao bì đi kèm cần được phân loại riêng.',
      warningEn: 'Any packaging should be sorted separately.',
    },
  ),
  ...defaultRules(['battery', 'mobile_phone', 'electronic_cable', 'broken_glass', 'light_bulb', 'chemical_container', 'paint_container', 'pesticide_container', 'aerosol_can', 'loose_medicine', 'used_syringe', 'power_bank', 'small_e_waste', 'eye_drop_container', 'topical_cream_container', 'medicine_bottle'], 'special_handling', {
    vi: 'Vật phẩm này cần xử lý riêng.',
    en: 'Special handling is required for this item.',
    stepsVi: ['Không bỏ vào năm thùng rác thông thường.', 'Dùng điểm thu gom được phê duyệt hoặc hỏi nhân viên phụ trách.'],
    stepsEn: ['Do not place it in the five general waste bins.', 'Use an approved collection point or follow instructions from responsible staff.'],
    warningVi: 'Không cố tháo, đập vỡ hoặc xử lý sâu vật phẩm này.',
    warningEn: 'Do not dismantle, crush or attempt detailed handling of this item.',
  }),
  ...defaultRules(['laptop', 'tablet', 'keyboard', 'computer_mouse', 'headphones', 'charger', 'power_adapter', 'extension_cord', 'remote_control', 'digital_camera', 'printer', 'printer_cartridge', 'ink_cartridge', 'smoke_detector', 'fire_extinguisher', 'propane_canister', 'nail_polish', 'nail_polish_remover', 'mercury_thermometer', 'fluorescent_tube', 'bleach_container', 'drain_cleaner_container', 'paint_thinner_container', 'e_cigarette'], 'special_handling', {
    vi: 'Vật phẩm này cần xử lý riêng.',
    en: 'Special handling is required for this item.',
    stepsVi: ['Không bỏ vào năm thùng rác thông thường.', 'Dùng điểm thu gom được phê duyệt hoặc hỏi nhân viên phụ trách.'],
    stepsEn: ['Do not place it in the five general waste bins.', 'Use an approved collection point or follow instructions from responsible staff.'],
    warningVi: 'Không cố tháo, đập vỡ hoặc xử lý sâu vật phẩm này.',
    warningEn: 'Do not dismantle, crush or attempt detailed handling of this item.',
  }),
]

export const reuseSuggestions: ReuseSuggestion[] = [
  reuse('plastic_bottle_planter', 'plastic_water_bottle', undefined, 'Chậu cây nhỏ', 'Reuse as a small planter', 'Cắt phần thân chai sạch để trồng cây nhỏ.', 'Use a clean bottle as a small planter.', ['empty', 'unbroken_clean'], ['dirty', 'cannot_clean'], [
    'Rửa sạch chai.',
    'Để khô hoàn toàn.',
    'Cắt phần thân khi có người lớn hoặc nhân viên hỗ trợ.',
    'Thêm đất và cây nhỏ.',
  ], [
    'Rinse the bottle.',
    'Let it dry fully.',
    'Cut the body only with appropriate help.',
    'Add soil and a small plant.',
  ]),
  reuse('plastic_bottle_storage', 'plastic_water_bottle', undefined, 'Hộp đựng vật liệu thủ công', 'Store craft materials', 'Dùng chai sạch để đựng hạt, kẹp giấy hoặc vật liệu thủ công.', 'Use a clean bottle to store beads, clips or craft material.', ['empty', 'unbroken_clean'], ['dirty', 'cannot_clean'], [
    'Rửa sạch và tháo nhãn nếu muốn.',
    'Để chai khô.',
    'Đậy nắp và dán nhãn nội dung.',
  ], [
    'Rinse the bottle and remove the label if useful.',
    'Let it dry.',
    'Close the cap and label the contents.',
  ]),
  reuse('cardboard_storage', 'cardboard_box', undefined, 'Hộp lưu trữ', 'Reuse for storage', 'Giữ thùng carton sạch để lưu tài liệu hoặc vật dụng nhẹ.', 'Keep a clean cardboard box for documents or lightweight items.', ['clean_dry'], ['wet', 'greasy'], [
    'Kiểm tra thùng khô và không mốc.',
    'Gấp lại nếu chưa dùng ngay.',
    'Dán nhãn khi dùng để lưu trữ.',
  ], [
    'Check that the box is dry and not mouldy.',
    'Flatten it if you are not using it now.',
    'Label it when used for storage.',
  ]),
  reuse('cardboard_packaging', 'cardboard_box', undefined, 'Đóng gói lại', 'Reuse for packaging', 'Dùng thùng sạch làm lớp bảo vệ khi vận chuyển đồ nhẹ.', 'Use a clean box as protective packaging for light items.', ['clean_dry'], ['wet', 'greasy'], [
    'Loại bỏ băng keo thừa.',
    'Kiểm tra độ chắc của thùng.',
    'Dùng giấy sạch để chèn đồ nếu cần.',
  ], [
    'Remove loose tape.',
    'Check that the box is sturdy.',
    'Use clean paper as padding if needed.',
  ]),
  reuse('glass_vase', 'glass_drink_bottle', undefined, 'Bình hoa nhỏ', 'Reuse as a flower vase', 'Chai thủy tinh sạch có thể dùng làm bình hoa nhỏ.', 'A clean glass bottle can become a small flower vase.', ['empty', 'unbroken_clean'], ['dirty'], [
    'Rửa sạch chai.',
    'Kiểm tra không có cạnh sắc hoặc nứt.',
    'Thêm nước và cắm hoa.',
  ], [
    'Wash the bottle.',
    'Check that it has no sharp edge or crack.',
    'Add water and flowers.',
  ]),
]

function material(code: MaterialCode, nameVi: string, nameEn: string): Material {
  return {
    code,
    nameVi,
    nameEn,
    descriptionVi: nameVi,
    descriptionEn: nameEn,
  }
}

function categoryForBin(destination: BinCode) {
  switch (destination) {
    case 'bottle_can': return 'Bottle & Can'
    case 'organic': return 'Organic Waste'
    case 'clean_plastic': return 'Clean Plastic'
    case 'paper_cardboard': return 'Paper & Cardboard'
    case 'landfill': return 'Landfill'
    case 'special_handling': return 'Special Handling'
    case 'mixed_uncertain': return 'Mixed or Uncertain'
  }
}

function item(
  code: string,
  nameVi: string,
  nameEn: string,
  primaryMaterialCode: MaterialCode,
  objectType: string,
  category: string,
  hazardFlag: boolean,
  specialHandling: boolean,
  aliasesVi: string[],
  aliasesEn: string[],
): WasteItem {
  return {
    code,
    nameVi,
    nameEn,
    primaryMaterialCode,
    objectType,
    category,
    hazardFlag,
    specialHandling,
    imageKey: code,
    aliasesVi,
    aliasesEn,
    isActive: true,
    verificationStatus: code === 'unknown' ? PENDING : SIGNAGE,
  }
}

function option(value: ConditionKey, labelVi: string, labelEn: string) {
  return { value, labelVi, labelEn }
}

function component(
  code: string,
  componentVi: string,
  componentEn: string,
  destinationBinCode: BinCode,
  metadata: Pick<ComponentAction, 'materialVi' | 'materialEn' | 'disposalNoteVi' | 'disposalNoteEn'> = {},
): ComponentAction {
  return { code, componentVi, componentEn, destinationBinCode, ...metadata }
}

function rule(
  itemCode: string,
  conditionKey: ConditionKey,
  destinationBinCode: BinCode,
  text: {
    vi: string
    en: string
    stepsVi: string[]
    stepsEn: string[]
    warningVi?: string
    warningEn?: string
    whyVi?: string
    whyEn?: string
    components?: ComponentAction[]
    stepComponentCodes?: string[][]
  },
  priority = 100,
): DisposalRule {
  return {
    siteCode: 'default_station',
    itemCode,
    conditionKey,
    destinationBinCode,
    instructionShortVi: text.vi,
    instructionShortEn: text.en,
    instructionDetailedVi: text.vi,
    instructionDetailedEn: text.en,
    whyCategoryVi: text.whyVi ?? defaultWhyForBin(destinationBinCode, 'vi'),
    whyCategoryEn: text.whyEn ?? defaultWhyForBin(destinationBinCode, 'en'),
    preparationStepsVi: text.stepsVi,
    preparationStepsEn: text.stepsEn,
    preparationComponentCodes: text.stepsEn.map((_, index) => text.stepComponentCodes?.[index] ?? []),
    warningVi: text.warningVi,
    warningEn: text.warningEn,
    componentActions: text.components ?? [],
    priority,
    verificationStatus: SIGNAGE,
    sourceReference: 'Local sorting guidance and MVP rule brief',
    isActive: true,
  }
}

function defaultWhyForBin(destinationBinCode: BinCode, locale: 'vi' | 'en') {
  const isVi = locale === 'vi'

  switch (destinationBinCode) {
    case 'bottle_can':
      return isVi
        ? 'Chai và lon rỗng thuộc nhóm Bottle & Can vì chúng có thể được thu gom riêng; chất lỏng còn lại cần được đổ bỏ để tránh nhiễm bẩn.'
        : 'Empty bottles and cans belong in Bottle & Can because they can be collected separately; remaining liquid should be removed to prevent contamination.'
    case 'organic':
      return isVi
        ? 'Thức ăn, vỏ trái cây và chất lỏng thuộc nhóm hữu cơ vì chúng cần được tách khỏi bao bì và vật liệu tái chế.'
        : 'Food scraps, fruit peels, and liquids belong in Organic Waste because they should be separated from packaging and recyclable materials.'
    case 'clean_plastic':
      return isVi
        ? 'Nhựa sạch có thể đi vào luồng Clean Plastic; thức ăn hoặc chất lỏng còn sót lại có thể làm bẩn cả nhóm tái chế.'
        : 'Clean plastic belongs in Clean Plastic because food or liquid residue can contaminate the recyclable plastic stream.'
    case 'paper_cardboard':
      return isVi
        ? 'Giấy và bìa chỉ phù hợp với Paper & Cardboard khi sạch và khô; nước, dầu mỡ hoặc thức ăn có thể làm hỏng luồng tái chế.'
        : 'Paper and cardboard belong here only when clean and dry; moisture, grease, or food residue can spoil the paper recycling stream.'
    case 'landfill':
      return isVi
        ? 'Vật phẩm này thuộc Landfill vì lớp phủ, chất bẩn hoặc vật liệu hỗn hợp khiến nó khó được xử lý trong các luồng tái chế tại điểm rác này.'
        : 'This item belongs in Landfill because lining, contamination, or mixed materials make it unsuitable for the recycling streams at this station.'
    case 'special_handling':
      return isVi
        ? 'Vật phẩm này cần xử lý riêng vì có thể gây rủi ro an toàn hoặc cần điểm thu gom được phê duyệt.'
        : 'This item needs special handling because it may create safety risks or require an approved collection point.'
    case 'mixed_uncertain':
      return isVi
        ? 'Không chọn thùng vì mô hình chỉ xác định được vật liệu hỗn hợp hoặc chưa chắc chắn.'
        : 'No bin is selected because the material model could only identify a mixed or uncertain material.'
  }
}

function containerToBottleCanRules(itemCode: string, viName: string, enName: string): DisposalRule[] {
  const components = [
    component('remaining_liquid', 'Chất lỏng còn lại', 'Remaining liquid', 'organic', {
      materialVi: 'Chất lỏng',
      materialEn: 'Liquid',
    }),
    component('container', 'Thân chai / lon', 'Bottle or can body', 'bottle_can'),
    component('plastic_cap', 'Nắp nhựa', 'Plastic cap', 'clean_plastic', {
      materialVi: 'Nhựa',
      materialEn: 'Plastic',
    }),
  ]

  return [
    rule(itemCode, 'empty', 'bottle_can', {
      vi: `Đặt ${viName} rỗng vào thùng Chai & Lon.`,
      en: `Place the empty ${enName} in Bottle & Can.`,
      stepsVi: ['Đổ bỏ chất lỏng còn lại nếu có.', 'Đảm bảo vật phẩm rỗng.', 'Đặt vào Chai & Lon.'],
      stepsEn: ['Empty any remaining liquid.', 'Make sure the item is empty.', 'Place it in Bottle & Can.'],
      components,
      stepComponentCodes: [
        ['remaining_liquid'],
        ['container'],
        ['container', 'plastic_cap'],
      ],
    }),
    rule(itemCode, 'contains_liquid', 'bottle_can', {
      vi: `Đổ chất lỏng còn lại, sau đó đặt ${viName} rỗng vào Chai & Lon.`,
      en: `Pour out the remaining liquid, then place the empty ${enName} in Bottle & Can.`,
      stepsVi: ['Đổ chất lỏng còn lại vào Hữu Cơ.', 'Để vật phẩm rỗng.', 'Đặt vỏ rỗng vào Chai & Lon.'],
      stepsEn: ['Pour remaining liquid into Organic Waste.', 'Keep the container empty.', 'Place the empty container in Bottle & Can.'],
      components,
      stepComponentCodes: [
        ['remaining_liquid'],
        ['container'],
        ['container', 'plastic_cap'],
      ],
    }),
  ]
}

function plasticCupRules(itemCode: string, viName: string, enName: string): DisposalRule[] {
  const cupWhyVi = 'Ly này được làm từ nhựa có thể tái chế, nhưng thức ăn hoặc chất lỏng còn sót lại có thể khiến vật phẩm không được tái chế.'
  const cupWhyEn = 'This cup is made from recyclable plastic, but food or liquid contamination may prevent it from being recycled.'
  const cupStepsVi = ['Đổ chất lỏng còn lại.', 'Rửa ly.', 'Tháo nắp và ống hút.', 'Để khô.', 'Đặt từng phần vào đúng thùng.']
  const cupStepsEn = ['Empty remaining liquid.', 'Rinse the cup.', 'Remove the lid and straw.', 'Let it dry.', 'Place each component in the correct bin.']
  const cupStepComponentCodes = [
    ['remaining_liquid'],
    ['cup'],
    ['lid', 'straw'],
    ['cup', 'lid', 'paper_sleeve'],
    ['cup', 'lid', 'straw', 'paper_sleeve'],
  ]

  return [
    rule(itemCode, 'clean_empty', 'clean_plastic', {
      vi: `Đặt ${viName} sạch và rỗng vào thùng Nhựa Sạch.`,
      en: `Place the clean and empty ${enName} in Clean Plastic.`,
      stepsVi: cupStepsVi,
      stepsEn: cupStepsEn,
      whyVi: cupWhyVi,
      whyEn: cupWhyEn,
      components: plasticCupComponents,
      stepComponentCodes: cupStepComponentCodes,
    }),
    rule(itemCode, 'contains_food_liquid', 'clean_plastic', {
      vi: `Đổ thức ăn hoặc chất lỏng, rửa ${viName}, rồi đặt vào Nhựa Sạch.`,
      en: `Empty food or liquid, rinse the ${enName}, then place it in Clean Plastic.`,
      stepsVi: cupStepsVi,
      stepsEn: cupStepsEn,
      whyVi: cupWhyVi,
      whyEn: cupWhyEn,
      components: [foodFromPlastic[0], ...plasticCupComponents],
      stepComponentCodes: cupStepComponentCodes,
    }),
    rule(itemCode, 'empty_dirty_cleanable', 'clean_plastic', {
      vi: `Rửa sạch ${viName}, để ráo, rồi đặt vào Nhựa Sạch.`,
      en: `Rinse the ${enName}, let it dry, then place it in Clean Plastic.`,
      stepsVi: cupStepsVi,
      stepsEn: cupStepsEn,
      whyVi: cupWhyVi,
      whyEn: cupWhyEn,
      components: plasticCupComponents,
      stepComponentCodes: cupStepComponentCodes,
    }),
    rule(itemCode, 'cannot_clean', 'landfill', {
      vi: `Nếu ${viName} không thể làm sạch, đặt vào Chất Thải Chôn Lấp.`,
      en: `If the ${enName} cannot be cleaned, place it in Landfill.`,
      stepsVi: ['Đổ bỏ chất lỏng hoặc thức ăn còn lại.', 'Đặt phần bẩn không thể làm sạch vào Chất Thải Chôn Lấp.'],
      stepsEn: ['Remove any remaining food or liquid.', 'Place the contaminated item in Landfill.'],
      whyVi: cupWhyVi,
      whyEn: cupWhyEn,
      warningVi: 'Nhựa còn dính dầu mỡ hoặc thức ăn không nên bỏ vào Nhựa Sạch.',
      warningEn: 'Greasy or food-contaminated plastic should not go in Clean Plastic.',
    }),
  ]
}

function plasticContainerRules(itemCode: string, viName: string, enName: string): DisposalRule[] {
  return [
    rule(itemCode, 'clean_empty', 'clean_plastic', {
      vi: `Đặt ${viName} sạch vào thùng Nhựa Sạch.`,
      en: `Place the clean ${enName} in Clean Plastic.`,
      stepsVi: ['Đảm bảo hộp không còn thức ăn.', 'Để khô nếu vừa rửa.', 'Đặt vào Nhựa Sạch.'],
      stepsEn: ['Make sure no food remains.', 'Let it dry if rinsed.', 'Place it in Clean Plastic.'],
    }),
    rule(itemCode, 'contains_food_liquid', 'clean_plastic', {
      vi: `Đổ thức ăn vào Hữu Cơ, rửa hộp, rồi đặt hộp sạch vào Nhựa Sạch.`,
      en: `Empty food into Organic Waste, rinse the container, then place the clean container in Clean Plastic.`,
      stepsVi: ['Đổ thức ăn còn lại vào Hữu Cơ.', 'Rửa hộp.', 'Để ráo.', 'Đặt hộp sạch vào Nhựa Sạch.'],
      stepsEn: ['Empty leftover food into Organic Waste.', 'Rinse the container.', 'Let it dry.', 'Place the clean container in Clean Plastic.'],
      components: foodFromPlastic,
    }),
    rule(itemCode, 'empty_dirty_cleanable', 'clean_plastic', {
      vi: `Rửa sạch ${viName}, để ráo, rồi đặt vào Nhựa Sạch.`,
      en: `Clean the ${enName}, let it dry, then place it in Clean Plastic.`,
      stepsVi: ['Rửa phần bẩn.', 'Để ráo.', 'Đặt vào Nhựa Sạch.'],
      stepsEn: ['Rinse the dirty area.', 'Let it dry.', 'Place it in Clean Plastic.'],
    }),
    rule(itemCode, 'cannot_clean', 'landfill', {
      vi: `Nếu ${viName} bị nhiễm bẩn nặng hoặc không thể làm sạch, đặt vào Chất Thải Chôn Lấp.`,
      en: `If the ${enName} is heavily contaminated or cannot be cleaned, place it in Landfill.`,
      stepsVi: ['Đổ bỏ thức ăn còn lại.', 'Đặt hộp bẩn vào Chất Thải Chôn Lấp.'],
      stepsEn: ['Remove leftover food.', 'Place the contaminated container in Landfill.'],
      warningVi: 'Chỉ bỏ nhựa vào Nhựa Sạch khi đã sạch.',
      warningEn: 'Only place plastic in Clean Plastic when it is clean.',
    }),
  ]
}

function cleanPlasticRules(itemCodes: string[]): DisposalRule[] {
  return itemCodes.flatMap((itemCode) => [
    rule(itemCode, 'clean', 'clean_plastic', {
      vi: 'Đặt vật phẩm nhựa sạch vào thùng Nhựa Sạch.',
      en: 'Place the clean plastic item in Clean Plastic.',
      stepsVi: ['Loại bỏ thức ăn hoặc chất lỏng nếu có.', 'Đảm bảo vật phẩm sạch.', 'Đặt vào Nhựa Sạch.'],
      stepsEn: ['Remove any food or liquid.', 'Make sure the item is clean.', 'Place it in Clean Plastic.'],
    }),
    rule(itemCode, 'dirty', 'landfill', {
      vi: 'Nếu vật phẩm nhựa còn bẩn hoặc dính thức ăn, đặt vào Chất Thải Chôn Lấp.',
      en: 'If the plastic item is dirty or food-contaminated, place it in Landfill.',
      stepsVi: ['Không bỏ vào Nhựa Sạch khi còn bẩn.', 'Đặt vào Chất Thải Chôn Lấp.'],
      stepsEn: ['Do not place it in Clean Plastic while contaminated.', 'Place it in Landfill.'],
      warningVi: 'Nếu có thể rửa sạch và làm khô, hãy chọn tình trạng sạch.',
      warningEn: 'If it can be rinsed and dried, choose the clean condition.',
    }),
  ])
}

function paperRules(itemCodes: string[], allowSplit = false): DisposalRule[] {
  return itemCodes.flatMap((itemCode) => [
    rule(itemCode, 'clean_dry', 'paper_cardboard', {
      vi: 'Đặt giấy hoặc bìa sạch, khô vào thùng Giấy & Bìa Carton.',
      en: 'Place clean and dry paper or cardboard in Paper & Cardboard.',
      stepsVi: ['Loại bỏ thức ăn hoặc chất lỏng.', 'Giữ vật phẩm sạch và khô.', 'Đặt vào Giấy & Bìa Carton.'],
      stepsEn: ['Remove food or liquid.', 'Keep the item clean and dry.', 'Place it in Paper & Cardboard.'],
    }),
    rule(itemCode, 'wet', 'landfill', {
      vi: 'Giấy hoặc bìa bị ướt nên đặt vào Chất Thải Chôn Lấp.',
      en: 'Wet paper or cardboard should go in Landfill.',
      stepsVi: ['Không bỏ giấy ướt vào thùng giấy sạch.', 'Đặt vào Chất Thải Chôn Lấp.'],
      stepsEn: ['Do not place wet paper in the clean paper bin.', 'Place it in Landfill.'],
      warningVi: 'Giấy ướt có thể làm nhiễm bẩn cả thùng tái chế.',
      warningEn: 'Wet paper can contaminate the recycling stream.',
    }),
    rule(itemCode, 'greasy', 'landfill', {
      vi: 'Giấy hoặc bìa dính dầu mỡ nên đặt vào Chất Thải Chôn Lấp.',
      en: 'Greasy or contaminated paper/cardboard should go in Landfill.',
      stepsVi: ['Không bỏ phần dính dầu mỡ vào Giấy & Bìa Carton.', 'Đặt vào Chất Thải Chôn Lấp.'],
      stepsEn: ['Do not place greasy material in Paper & Cardboard.', 'Place it in Landfill.'],
    }),
    ...(allowSplit
      ? [
          rule(itemCode, 'partly_greasy', 'paper_cardboard', {
            vi: 'Tách phần sạch vào Giấy & Bìa Carton và phần dính dầu mỡ vào Chất Thải Chôn Lấp.',
            en: 'Separate the clean section into Paper & Cardboard and the greasy section into Landfill.',
            stepsVi: ['Xé hoặc tách phần sạch.', 'Đặt phần sạch, khô vào Giấy & Bìa Carton.', 'Đặt phần dính dầu mỡ vào Chất Thải Chôn Lấp.'],
            stepsEn: ['Tear away the clean section.', 'Place clean and dry cardboard in Paper & Cardboard.', 'Place greasy cardboard in Landfill.'],
            components: splitPizzaBox,
          }),
        ]
      : [
          rule(itemCode, 'partly_greasy', 'landfill', {
            vi: 'Nếu không thể tách sạch phần bẩn, đặt vật phẩm vào Chất Thải Chôn Lấp.',
            en: 'If the contaminated section cannot be separated cleanly, place the item in Landfill.',
            stepsVi: ['Tách phần sạch nếu có thể.', 'Nếu không tách được, đặt vào Chất Thải Chôn Lấp.'],
            stepsEn: ['Separate the clean section if possible.', 'If not, place the item in Landfill.'],
            warningVi: 'Chỉ bỏ phần giấy sạch, khô vào Giấy & Bìa Carton.',
            warningEn: 'Only clean and dry paper should go in Paper & Cardboard.',
          }),
        ]),
  ])
}

function defaultRules(
  itemCodes: string[],
  destinationBinCode: BinCode,
  text: {
    vi: string
    en: string
    stepsVi: string[]
    stepsEn: string[]
    warningVi?: string
    warningEn?: string
  },
): DisposalRule[] {
  return itemCodes.map((itemCode) =>
    rule(itemCode, 'default', destinationBinCode, {
      vi: text.vi,
      en: text.en,
      stepsVi: text.stepsVi,
      stepsEn: text.stepsEn,
      warningVi: text.warningVi,
      warningEn: text.warningEn,
    }),
  )
}

function reuse(
  code: string,
  itemCode: string | undefined,
  materialCode: MaterialCode | undefined,
  titleVi: string,
  titleEn: string,
  summaryVi: string,
  summaryEn: string,
  requiredCondition: ConditionKey[] | undefined,
  prohibitedCondition: ConditionKey[] | undefined,
  stepsVi: string[],
  stepsEn: string[],
): ReuseSuggestion {
  return {
    code,
    itemCode,
    materialCode,
    titleVi,
    titleEn,
    summaryVi,
    summaryEn,
    requiredCondition,
    prohibitedCondition,
    stepsVi,
    stepsEn,
    safetyNoteVi: 'Chỉ tái sử dụng khi vật phẩm sạch, khô và không sắc nhọn.',
    safetyNoteEn: 'Reuse only when the item is clean, dry and not sharp.',
    difficulty: 'Easy',
    estimatedMinutes: 10,
    priority: 100,
    verificationStatus: PENDING,
    isActive: true,
  }
}
