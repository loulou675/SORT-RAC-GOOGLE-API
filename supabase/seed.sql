insert into public.site_profiles (code, name_vi, name_en, country, city, description_vi, description_en, is_active)
values
  ('default_station', 'Trạm phân loại mặc định', 'Default sorting station', 'Vietnam', 'Ho Chi Minh City', 'Hướng dẫn phân loại rác cho trạm đã chọn.', 'Waste sorting guidance for the selected station.', true)
on conflict (code) do update set
  name_vi = excluded.name_vi,
  name_en = excluded.name_en,
  description_vi = excluded.description_vi,
  description_en = excluded.description_en,
  is_active = excluded.is_active;

insert into public.materials (code, name_vi, name_en, description_vi, description_en)
values
  ('pet_plastic', 'Nhựa PET', 'PET plastic', 'Nhựa PET', 'PET plastic'),
  ('rigid_plastic', 'Nhựa cứng', 'Rigid plastic', 'Nhựa cứng', 'Rigid plastic'),
  ('soft_plastic', 'Nhựa mềm', 'Soft plastic', 'Nhựa mềm', 'Soft plastic'),
  ('mixed_plastic', 'Nhựa hỗn hợp', 'Mixed plastic', 'Nhựa hỗn hợp', 'Mixed plastic'),
  ('aluminium', 'Nhôm', 'Aluminium', 'Nhôm', 'Aluminium'),
  ('steel', 'Thép', 'Steel', 'Thép', 'Steel'),
  ('glass', 'Thủy tinh', 'Glass', 'Thủy tinh', 'Glass'),
  ('paper', 'Giấy', 'Paper', 'Giấy', 'Paper'),
  ('cardboard', 'Bìa carton', 'Cardboard', 'Bìa carton', 'Cardboard'),
  ('organic', 'Hữu cơ', 'Organic', 'Hữu cơ', 'Organic'),
  ('mixed_material', 'Vật liệu hỗn hợp', 'Mixed material', 'Vật liệu hỗn hợp', 'Mixed material'),
  ('wood', 'Gỗ', 'Wood', 'Gỗ', 'Wood'),
  ('electronic', 'Điện tử', 'Electronic', 'Điện tử', 'Electronic'),
  ('hazardous', 'Nguy hại', 'Hazardous', 'Nguy hại', 'Hazardous'),
  ('unknown', 'Chưa xác định', 'Unknown', 'Chưa xác định', 'Unknown')
on conflict (code) do update set
  name_vi = excluded.name_vi,
  name_en = excluded.name_en,
  description_vi = excluded.description_vi,
  description_en = excluded.description_en;

with site as (
  select id from public.site_profiles where code = 'default_station'
)
insert into public.bins (site_id, code, name_vi, name_en, color_name, color_hex, icon_key, description_vi, description_en, sort_order, is_active)
select site.id, data.code, data.name_vi, data.name_en, data.color_name, data.color_hex, data.icon_key, data.description_vi, data.description_en, data.sort_order, true
from site
cross join (
  values
    ('bottle_can', 'Chai & Lon', 'Bottle & Can', 'Orange', '#d98b52', 'bottle', 'Chai nhựa rỗng, lon nhôm và chai được chấp nhận.', 'Empty plastic drink bottles, aluminium cans and accepted bottles.', 1),
    ('organic', 'Chất Thải Hữu Cơ', 'Organic Waste', 'Green', '#7fa36b', 'leaf', 'Thức ăn thừa, vỏ trái cây và chất lỏng được chấp nhận.', 'Leftover food, fruit peels and accepted liquids.', 2),
    ('clean_plastic', 'Nhựa Sạch', 'Clean Plastic', 'Red', '#d9675e', 'cup', 'Ly nhựa sạch, hộp nhựa sạch, túi nhựa sạch và bao bì sạch.', 'Clean plastic cups, containers, bags, snack packaging and clean foam.', 3),
    ('paper_cardboard', 'Giấy & Bìa Carton', 'Paper & Cardboard', 'Blue', '#7896d2', 'paper', 'Giấy, túi giấy và bìa carton sạch, khô.', 'Clean and dry paper, cardboard and paper bags.', 4),
    ('landfill', 'Chất Thải Chôn Lấp', 'Landfill', 'Brown', '#a86e50', 'landfill', 'Nhựa bẩn, ly giấy, khăn giấy và bao bì nhiễm bẩn.', 'Dirty plastic, paper cups, tissues, napkins and contaminated packaging.', 5),
    ('special_handling', 'Xử Lý Riêng', 'Hazardous', 'Yellow', '#e8c35a', 'alert', 'Vật phẩm cần điểm thu gom được phê duyệt hoặc hướng dẫn từ nhân viên phụ trách.', 'Items that need an approved collection point or guidance from responsible staff.', 6)
) as data(code, name_vi, name_en, color_name, color_hex, icon_key, description_vi, description_en, sort_order)
on conflict (site_id, code) do update set
  name_vi = excluded.name_vi,
  name_en = excluded.name_en,
  color_name = excluded.color_name,
  color_hex = excluded.color_hex,
  icon_key = excluded.icon_key,
  description_vi = excluded.description_vi,
  description_en = excluded.description_en,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.waste_items (code, name_vi, name_en, primary_material_id, object_type, hazard_flag, special_handling, image_key, is_active, verification_status)
select data.code, data.name_vi, data.name_en, materials.id, data.object_type, data.hazard_flag, data.special_handling, data.code, true, data.verification_status
from (
  values
    ('plastic_water_bottle', 'Chai nước nhựa', 'Plastic water bottle', 'pet_plastic', 'bottle', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('plastic_soft_drink_bottle', 'Chai nước ngọt nhựa', 'Plastic soft-drink bottle', 'pet_plastic', 'bottle', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('aluminium_drink_can', 'Lon nước nhôm', 'Aluminium drink can', 'aluminium', 'can', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('steel_food_can', 'Lon thực phẩm thép', 'Steel food can', 'steel', 'can', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('glass_drink_bottle', 'Chai thủy tinh', 'Glass drink bottle', 'glass', 'bottle', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('plastic_takeaway_cup', 'Ly nhựa mang đi', 'Plastic takeaway cup', 'rigid_plastic', 'cup', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('plastic_cup_lid', 'Nắp ly nhựa', 'Plastic cup lid', 'rigid_plastic', 'lid', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('plastic_straw', 'Ống hút nhựa', 'Plastic straw', 'mixed_plastic', 'straw', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('plastic_food_container', 'Hộp nhựa đựng thức ăn', 'Plastic food container', 'rigid_plastic', 'container', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('plastic_cosmetic_container', 'Vỏ mỹ phẩm nhựa', 'Plastic cosmetic container', 'rigid_plastic', 'container', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('plastic_takeaway_box', 'Hộp nhựa mang đi', 'Plastic takeaway box', 'rigid_plastic', 'container', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('clean_plastic_bag', 'Túi nhựa sạch', 'Clean plastic bag', 'soft_plastic', 'bag', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('dirty_plastic_bag', 'Túi nhựa bẩn', 'Dirty plastic bag', 'soft_plastic', 'bag', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('snack_wrapper', 'Vỏ gói snack', 'Snack wrapper', 'mixed_plastic', 'wrapper', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('instant_noodle_packaging', 'Bao bì mì ăn liền', 'Instant noodle packaging', 'mixed_plastic', 'wrapper', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('clean_styrofoam_container', 'Hộp xốp sạch', 'Clean styrofoam container', 'mixed_plastic', 'foam', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('dirty_styrofoam_container', 'Hộp xốp bẩn', 'Dirty styrofoam container', 'mixed_plastic', 'foam', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('printing_paper', 'Giấy in', 'Printing paper', 'paper', 'paper', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('notebook_paper', 'Giấy vở', 'Notebook paper', 'paper', 'paper', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('newspaper', 'Báo giấy', 'Newspaper', 'paper', 'paper', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('magazine', 'Tạp chí', 'Magazine', 'paper', 'paper', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('paper_bag', 'Túi giấy', 'Paper bag', 'paper', 'bag', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('cardboard_box', 'Thùng carton', 'Cardboard box', 'cardboard', 'box', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('pizza_box', 'Hộp pizza', 'Pizza box', 'cardboard', 'box', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('paper_cup', 'Ly giấy', 'Paper cup', 'mixed_material', 'cup', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('tissue', 'Khăn giấy', 'Tissue', 'paper', 'paper', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('paper_napkin', 'Khăn ăn giấy', 'Paper napkin', 'paper', 'paper', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('food_waste', 'Thức ăn thừa', 'Food waste', 'organic', 'food', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('leftover_rice', 'Cơm thừa', 'Leftover rice', 'organic', 'food', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('leftover_noodles', 'Mì thừa', 'Leftover noodles', 'organic', 'food', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('fruit_peel', 'Vỏ trái cây', 'Fruit peel', 'organic', 'food', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('coffee_grounds', 'Bã cà phê', 'Coffee grounds', 'organic', 'food', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('tea_bag', 'Túi trà', 'Tea bag', 'mixed_material', 'food', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('leftover_drink', 'Đồ uống thừa', 'Leftover drink', 'organic', 'liquid', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('milk_tea_cup', 'Ly trà sữa', 'Milk tea cup', 'rigid_plastic', 'cup', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('plastic_spoon', 'Muỗng nhựa', 'Plastic spoon', 'mixed_plastic', 'utensil', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('plastic_fork', 'Nĩa nhựa', 'Plastic fork', 'mixed_plastic', 'utensil', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('wooden_utensil', 'Dụng cụ gỗ dùng một lần', 'Wooden utensil', 'wood', 'utensil', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('battery', 'Pin', 'Battery', 'hazardous', 'battery', true, true, 'BASED_ON_LOCAL_GUIDANCE'),
    ('mobile_phone', 'Điện thoại di động', 'Mobile phone', 'electronic', 'device', true, true, 'BASED_ON_LOCAL_GUIDANCE'),
    ('electronic_cable', 'Dây cáp điện tử', 'Electronic cable', 'electronic', 'cable', true, true, 'BASED_ON_LOCAL_GUIDANCE'),
    ('broken_glass', 'Thủy tinh vỡ', 'Broken glass', 'glass', 'glass', true, true, 'BASED_ON_LOCAL_GUIDANCE'),
    ('light_bulb', 'Bóng đèn', 'Light bulb', 'hazardous', 'bulb', true, true, 'BASED_ON_LOCAL_GUIDANCE'),
    ('chemical_container', 'Bao bì hóa chất', 'Chemical container', 'hazardous', 'container', true, true, 'BASED_ON_LOCAL_GUIDANCE'),
    ('paint_container', 'Thùng sơn', 'Paint container', 'hazardous', 'container', true, true, 'BASED_ON_LOCAL_GUIDANCE'),
    ('pesticide_container', 'Bao bì thuốc trừ sâu', 'Pesticide container', 'hazardous', 'container', true, true, 'BASED_ON_LOCAL_GUIDANCE'),
    ('aerosol_can', 'Bình xịt', 'Aerosol can', 'hazardous', 'can', true, true, 'BASED_ON_LOCAL_GUIDANCE'),
    ('medicine_blister_pack', 'Vỏ thuốc rỗng', 'Empty medicine packaging', 'mixed_material', 'packaging', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('loose_medicine', 'Thuốc không sử dụng', 'Unused medicine', 'hazardous', 'small_waste', true, true, 'BASED_ON_LOCAL_GUIDANCE'),
    ('used_syringe', 'Kim tiêm đã sử dụng', 'Used syringe', 'hazardous', 'small_waste', true, true, 'BASED_ON_LOCAL_GUIDANCE'),
    ('power_bank', 'Pin sạc dự phòng', 'Power bank', 'electronic', 'device', true, true, 'BASED_ON_LOCAL_GUIDANCE'),
    ('small_e_waste', 'Rác điện tử nhỏ', 'Small e-waste', 'electronic', 'device', true, true, 'BASED_ON_LOCAL_GUIDANCE'),
    ('plastic_bag', 'Túi nhựa', 'Plastic bag', 'soft_plastic', 'bag', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('styrofoam_container', 'Hộp xốp', 'Styrofoam container', 'mixed_plastic', 'foam', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('envelope', 'Phong bì giấy', 'Paper envelope', 'paper', 'paper', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('paperboard_packaging', 'Hộp giấy mỏng', 'Paperboard packaging', 'cardboard', 'box', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('drink_carton', 'Hộp đồ uống nhiều lớp', 'Drink carton', 'mixed_material', 'box', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('paper_plate', 'Đĩa giấy', 'Paper plate', 'mixed_material', 'paper', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('receipt', 'Hóa đơn giấy', 'Receipt', 'mixed_material', 'paper', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('vegetable_scraps', 'Rau củ thừa', 'Vegetable scraps', 'organic', 'food', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('egg_shell', 'Vỏ trứng', 'Egg shell', 'organic', 'food', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('medical_mask', 'Khẩu trang y tế', 'Medical mask', 'mixed_material', 'mask', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('disposable_diaper', 'Tã dùng một lần', 'Disposable diaper', 'mixed_material', 'hygiene', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('sanitary_pad', 'Băng vệ sinh', 'Sanitary pad', 'mixed_material', 'hygiene', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('cigarette_butt', 'Đầu lọc thuốc lá', 'Cigarette butt', 'mixed_material', 'small_waste', false, false, 'BASED_ON_LOCAL_GUIDANCE'),
    ('unknown', 'Vật phẩm chưa xác định', 'Unknown item', 'unknown', 'unknown', false, false, 'PENDING_CONFIRMATION')
) as data(code, name_vi, name_en, material_code, object_type, hazard_flag, special_handling, verification_status)
join public.materials on materials.code = data.material_code
on conflict (code) do update set
  name_vi = excluded.name_vi,
  name_en = excluded.name_en,
  primary_material_id = excluded.primary_material_id,
  object_type = excluded.object_type,
  hazard_flag = excluded.hazard_flag,
  special_handling = excluded.special_handling,
  is_active = excluded.is_active,
  verification_status = excluded.verification_status;

insert into public.item_aliases (item_id, language, alias, normalized_alias)
select waste_items.id, 'vi', waste_items.name_vi, lower(waste_items.name_vi)
from public.waste_items
on conflict (item_id, language, normalized_alias) do nothing;

insert into public.item_aliases (item_id, language, alias, normalized_alias)
select waste_items.id, 'en', waste_items.name_en, lower(waste_items.name_en)
from public.waste_items
on conflict (item_id, language, normalized_alias) do nothing;

insert into public.item_aliases (item_id, language, alias, normalized_alias)
select waste_items.id, data.language, data.alias, lower(data.alias)
from (
  values
    ('plastic_water_bottle', 'vi', 'chai nhựa'), ('plastic_water_bottle', 'vi', 'chai nước'), ('plastic_water_bottle', 'vi', 'chai PET'), ('plastic_water_bottle', 'en', 'water bottle'), ('plastic_water_bottle', 'en', 'PET bottle'), ('plastic_water_bottle', 'en', 'plastic drink bottle'),
    ('paper_cup', 'vi', 'ly giấy'), ('paper_cup', 'vi', 'cốc giấy'), ('paper_cup', 'en', 'paper cup'), ('paper_cup', 'en', 'takeaway coffee cup'),
    ('plastic_takeaway_cup', 'vi', 'ly nhựa'), ('plastic_takeaway_cup', 'vi', 'ly trà sữa'), ('plastic_takeaway_cup', 'en', 'plastic cup'), ('plastic_takeaway_cup', 'en', 'takeaway cup'),
    ('battery', 'vi', 'pin'), ('battery', 'vi', 'pin tiểu'), ('battery', 'en', 'battery'), ('battery', 'en', 'AA battery'),
    ('pizza_box', 'vi', 'hộp pizza'), ('pizza_box', 'en', 'pizza box'),
    ('cardboard_box', 'vi', 'thùng carton'), ('cardboard_box', 'en', 'cardboard box'),
    ('fruit_peel', 'vi', 'vỏ chuối'), ('fruit_peel', 'en', 'banana peel')
) as data(item_code, language, alias)
join public.waste_items on waste_items.code = data.item_code
on conflict (item_id, language, normalized_alias) do nothing;

with item as (
  select id, code from public.waste_items
), questions as (
  select *
  from (
    values
      ('plastic_takeaway_cup', 'plastic_cup_condition', 'Ly đang ở tình trạng nào?', 'What is the condition of the cup?', '[{"value":"clean_empty","labelVi":"Sạch và rỗng","labelEn":"Clean and empty"},{"value":"contains_food_liquid","labelVi":"Còn thức ăn hoặc chất lỏng","labelEn":"Contains food or liquid"},{"value":"empty_dirty_cleanable","labelVi":"Bẩn nhưng có thể rửa sạch","labelEn":"Empty but can be rinsed clean"},{"value":"cannot_clean","labelVi":"Không thể làm sạch","labelEn":"Cannot be cleaned"}]'::jsonb),
      ('plastic_food_container', 'container_condition', 'Hộp đang ở tình trạng nào?', 'What is the condition of the container?', '[{"value":"clean_empty","labelVi":"Sạch và rỗng","labelEn":"Clean and empty"},{"value":"contains_food_liquid","labelVi":"Còn thức ăn","labelEn":"Contains leftover food"},{"value":"empty_dirty_cleanable","labelVi":"Bẩn nhưng có thể rửa sạch","labelEn":"Empty but can be cleaned"},{"value":"cannot_clean","labelVi":"Không thể làm sạch","labelEn":"Cannot be cleaned"}]'::jsonb),
      ('cardboard_box', 'paper_condition', 'Vật phẩm có sạch và khô không?', 'Is the item clean and dry?', '[{"value":"clean_dry","labelVi":"Sạch và khô","labelEn":"Yes, clean and dry"},{"value":"wet","labelVi":"Bị ướt","labelEn":"Wet"},{"value":"greasy","labelVi":"Dính dầu mỡ hoặc bẩn","labelEn":"Greasy or contaminated"},{"value":"partly_greasy","labelVi":"Chỉ bẩn một phần","labelEn":"Partly greasy"}]'::jsonb),
      ('pizza_box', 'paper_condition', 'Vật phẩm có sạch và khô không?', 'Is the item clean and dry?', '[{"value":"clean_dry","labelVi":"Sạch và khô","labelEn":"Yes, clean and dry"},{"value":"wet","labelVi":"Bị ướt","labelEn":"Wet"},{"value":"greasy","labelVi":"Dính dầu mỡ hoặc bẩn","labelEn":"Greasy or contaminated"},{"value":"partly_greasy","labelVi":"Chỉ bẩn một phần","labelEn":"Partly greasy"}]'::jsonb)
  ) as q(item_code, question_key, question_vi, question_en, options)
)
insert into public.condition_questions (item_id, question_key, question_vi, question_en, options, sort_order, is_active)
select item.id, questions.question_key, questions.question_vi, questions.question_en, questions.options, 1, true
from questions join item on item.code = questions.item_code;

with site as (select id from public.site_profiles where code = 'default_station'),
items as (select id, code from public.waste_items),
bin as (select id, code from public.bins where site_id = (select id from site)),
rules as (
  select *
  from (
    values
      ('plastic_water_bottle', 'empty', 'bottle_can', 'Đặt chai nhựa rỗng vào thùng Chai & Lon.', 'Place the empty plastic bottle in Bottle & Can.', '["Đổ bỏ chất lỏng còn lại nếu có.","Đảm bảo chai rỗng.","Đặt vào Chai & Lon."]'::jsonb, '["Empty any remaining liquid.","Make sure the bottle is empty.","Place it in Bottle & Can."]'::jsonb, null::text, null::text, '[]'::jsonb),
      ('plastic_water_bottle', 'contains_liquid', 'bottle_can', 'Đổ chất lỏng còn lại, sau đó đặt chai nhựa rỗng vào Chai & Lon.', 'Pour out the remaining liquid, then place the empty plastic bottle in Bottle & Can.', '["Đổ chất lỏng còn lại vào Hữu Cơ.","Để chai rỗng.","Đặt chai rỗng vào Chai & Lon."]'::jsonb, '["Pour remaining liquid into Organic Waste.","Keep the bottle empty.","Place the empty bottle in Bottle & Can."]'::jsonb, null::text, null::text, '[{"componentVi":"Chất lỏng còn lại","componentEn":"Remaining liquid","destinationBinCode":"organic"},{"componentVi":"Chai rỗng","componentEn":"Empty bottle","destinationBinCode":"bottle_can"}]'::jsonb),
      ('aluminium_drink_can', 'empty', 'bottle_can', 'Đặt lon nhôm rỗng vào thùng Chai & Lon.', 'Place the empty aluminium can in Bottle & Can.', '["Đảm bảo lon rỗng.","Đặt vào Chai & Lon."]'::jsonb, '["Make sure the can is empty.","Place it in Bottle & Can."]'::jsonb, null::text, null::text, '[]'::jsonb),
      ('plastic_takeaway_cup', 'clean_empty', 'clean_plastic', 'Đặt ly nhựa sạch và rỗng vào thùng Nhựa Sạch.', 'Place the clean and empty plastic cup in Clean Plastic.', '["Đảm bảo ly rỗng.","Rửa nếu cần.","Để ráo.","Đặt vào Nhựa Sạch."]'::jsonb, '["Make sure the cup is empty.","Rinse if needed.","Let it dry.","Place it in Clean Plastic."]'::jsonb, null::text, null::text, '[]'::jsonb),
      ('plastic_takeaway_cup', 'contains_food_liquid', 'clean_plastic', 'Đổ thức ăn hoặc chất lỏng, rửa ly, rồi đặt vào Nhựa Sạch.', 'Empty food or liquid, rinse the cup, then place it in Clean Plastic.', '["Đổ chất lỏng hoặc thức ăn vào Hữu Cơ.","Rửa ly.","Để ráo.","Đặt ly sạch vào Nhựa Sạch."]'::jsonb, '["Empty food or liquid into Organic Waste.","Rinse the cup.","Let it dry.","Place the clean cup in Clean Plastic."]'::jsonb, null::text, null::text, '[{"componentVi":"Thức ăn hoặc chất lỏng","componentEn":"Food or liquid","destinationBinCode":"organic"},{"componentVi":"Ly nhựa đã rửa sạch","componentEn":"Cleaned plastic cup","destinationBinCode":"clean_plastic"}]'::jsonb),
      ('plastic_takeaway_cup', 'cannot_clean', 'landfill', 'Nếu ly nhựa không thể làm sạch, đặt vào Chất Thải Chôn Lấp.', 'If the plastic cup cannot be cleaned, place it in Landfill.', '["Đổ bỏ chất lỏng hoặc thức ăn còn lại.","Đặt phần bẩn không thể làm sạch vào Chất Thải Chôn Lấp."]'::jsonb, '["Remove any remaining food or liquid.","Place the contaminated cup in Landfill."]'::jsonb, 'Nhựa còn dính dầu mỡ hoặc thức ăn không nên bỏ vào Nhựa Sạch.', 'Greasy or food-contaminated plastic should not go in Clean Plastic.', '[]'::jsonb),
      ('plastic_food_container', 'clean_empty', 'clean_plastic', 'Đặt hộp nhựa sạch vào thùng Nhựa Sạch.', 'Place the clean plastic food container in Clean Plastic.', '["Đảm bảo hộp không còn thức ăn.","Để khô nếu vừa rửa.","Đặt vào Nhựa Sạch."]'::jsonb, '["Make sure no food remains.","Let it dry if rinsed.","Place it in Clean Plastic."]'::jsonb, null::text, null::text, '[]'::jsonb),
      ('plastic_food_container', 'contains_food_liquid', 'clean_plastic', 'Đổ thức ăn vào Hữu Cơ, rửa hộp, rồi đặt hộp sạch vào Nhựa Sạch.', 'Empty food into Organic Waste, rinse the container, then place the clean container in Clean Plastic.', '["Đổ thức ăn còn lại vào Hữu Cơ.","Rửa hộp.","Để ráo.","Đặt hộp sạch vào Nhựa Sạch."]'::jsonb, '["Empty leftover food into Organic Waste.","Rinse the container.","Let it dry.","Place the clean container in Clean Plastic."]'::jsonb, null::text, null::text, '[{"componentVi":"Thức ăn hoặc chất lỏng","componentEn":"Food or liquid","destinationBinCode":"organic"},{"componentVi":"Hộp nhựa đã rửa sạch","componentEn":"Cleaned plastic container","destinationBinCode":"clean_plastic"}]'::jsonb),
      ('plastic_cosmetic_container', 'clean_empty', 'clean_plastic', 'Làm rỗng và làm sạch vỏ mỹ phẩm nhựa trước khi đặt vào Nhựa Sạch.', 'Empty and clean the plastic cosmetic container before placing it in Clean Plastic.', '["Lấy hết sản phẩm còn lại.","Lau hoặc rửa sạch nếu an toàn.","Để khô.","Đặt vào Nhựa Sạch."]'::jsonb, '["Remove any remaining product.","Wipe or rinse it when safe.","Let it dry.","Place it in Clean Plastic."]'::jsonb, null::text, null::text, '[]'::jsonb),
      ('plastic_cosmetic_container', 'contains_food_liquid', 'landfill', 'Nếu vỏ mỹ phẩm không thể làm sạch, đặt vào Chất Thải Chôn Lấp.', 'If the cosmetic container cannot be cleaned, place it in Landfill.', '["Không đổ hóa chất còn lại xuống cống.","Nếu không thể làm sạch an toàn, đặt vào Chất Thải Chôn Lấp."]'::jsonb, '["Do not pour remaining chemicals down a drain.","If it cannot be cleaned safely, place it in Landfill."]'::jsonb, null::text, null::text, '[]'::jsonb),
      ('cardboard_box', 'clean_dry', 'paper_cardboard', 'Đặt bìa carton sạch, khô vào thùng Giấy & Bìa Carton.', 'Place clean and dry cardboard in Paper & Cardboard.', '["Loại bỏ thức ăn hoặc chất lỏng.","Giữ bìa sạch và khô.","Đặt vào Giấy & Bìa Carton."]'::jsonb, '["Remove food or liquid.","Keep the cardboard clean and dry.","Place it in Paper & Cardboard."]'::jsonb, null::text, null::text, '[]'::jsonb),
      ('cardboard_box', 'greasy', 'landfill', 'Bìa carton dính dầu mỡ nên đặt vào Chất Thải Chôn Lấp.', 'Greasy cardboard should go in Landfill.', '["Không bỏ phần dính dầu mỡ vào Giấy & Bìa Carton.","Đặt vào Chất Thải Chôn Lấp."]'::jsonb, '["Do not place greasy material in Paper & Cardboard.","Place it in Landfill."]'::jsonb, null::text, null::text, '[]'::jsonb),
      ('pizza_box', 'partly_greasy', 'paper_cardboard', 'Tách phần sạch vào Giấy & Bìa Carton và phần dính dầu mỡ vào Chất Thải Chôn Lấp.', 'Separate the clean section into Paper & Cardboard and the greasy section into Landfill.', '["Tách phần sạch.","Đặt phần sạch, khô vào Giấy & Bìa Carton.","Đặt phần dính dầu mỡ vào Chất Thải Chôn Lấp."]'::jsonb, '["Separate the clean section.","Place clean and dry cardboard in Paper & Cardboard.","Place greasy cardboard in Landfill."]'::jsonb, null::text, null::text, '[{"componentVi":"Phần giấy sạch và khô","componentEn":"Clean and dry section","destinationBinCode":"paper_cardboard"},{"componentVi":"Phần dính dầu mỡ","componentEn":"Greasy section","destinationBinCode":"landfill"}]'::jsonb),
      ('paper_cup', 'default', 'landfill', 'Đổ chất lỏng còn lại vào Hữu Cơ, sau đó bỏ ly giấy vào Chất Thải Chôn Lấp.', 'Empty remaining liquid into Organic Waste, then place the paper cup in Landfill.', '["Đổ chất lỏng còn lại.","Không bỏ ly giấy vào Giấy & Bìa Carton.","Đặt ly vào Chất Thải Chôn Lấp."]'::jsonb, '["Empty remaining liquid.","Do not place the cup in Paper & Cardboard.","Place the cup in Landfill."]'::jsonb, 'Ly giấy thường có lớp phủ và không thuộc nhóm giấy sạch.', 'Paper cups usually have a lining and are not clean paper.', '[{"componentVi":"Chất lỏng còn lại","componentEn":"Remaining liquid","destinationBinCode":"organic"},{"componentVi":"Ly giấy","componentEn":"Paper cup","destinationBinCode":"landfill"}]'::jsonb),
      ('medicine_blister_pack', 'default', 'landfill', 'Đặt vỏ thuốc rỗng vào Chất Thải Chôn Lấp.', 'Place empty medicine packaging in Landfill.', '["Kiểm tra để chắc chắn vỏ không còn thuốc.","Đặt vỏ thuốc rỗng vào Chất Thải Chôn Lấp."]'::jsonb, '["Make sure no medicine remains in the packaging.","Place the empty packaging in Landfill."]'::jsonb, 'Nếu còn thuốc hoặc thuốc đã hết hạn, không bỏ vào Landfill; hãy dùng điểm thu gom thuốc phù hợp.', 'If medicine remains or has expired, do not use Landfill; use an appropriate medicine collection point.', '[]'::jsonb),
      ('drink_carton', 'default', 'paper_cardboard', 'Làm rỗng, tráng sạch và để khô hộp trước khi đặt vào Giấy & Bìa Carton.', 'Empty, rinse and dry the carton before placing it in Paper & Cardboard.', '["Đổ hết chất lỏng còn lại.","Tráng sạch hộp.","Để hộp ráo và khô.","Đặt vào Giấy & Bìa Carton."]'::jsonb, '["Empty any remaining liquid.","Rinse the carton.","Let it drain and dry.","Place it in Paper & Cardboard."]'::jsonb, 'Hộp đồ uống có nhiều lớp vật liệu; chỉ bỏ hộp rỗng, sạch và khô vào dòng này.', 'Drink cartons contain multiple material layers; use this stream only for empty, clean and dry cartons.', '[]'::jsonb),
      ('food_waste', 'default', 'organic', 'Đặt phần hữu cơ vào thùng Chất Thải Hữu Cơ.', 'Place the organic material in Organic Waste.', '["Tách bỏ bao bì không phải hữu cơ.","Đặt phần thức ăn vào Hữu Cơ."]'::jsonb, '["Remove any non-organic packaging.","Place the food in Organic Waste."]'::jsonb, 'Bao bì đi kèm cần được phân loại riêng.', 'Any packaging should be sorted separately.', '[]'::jsonb),
      ('fruit_peel', 'default', 'organic', 'Đặt vỏ trái cây vào thùng Chất Thải Hữu Cơ.', 'Place fruit peel in Organic Waste.', '["Tách bỏ tem nhãn hoặc bao bì.","Đặt vỏ trái cây vào Hữu Cơ."]'::jsonb, '["Remove labels or packaging.","Place fruit peel in Organic Waste."]'::jsonb, null::text, null::text, '[]'::jsonb),
      ('battery', 'default', 'special_handling', 'Vật phẩm này cần xử lý riêng.', 'Special handling is required for this item.', '["Không bỏ vào năm thùng rác thông thường.","Dùng điểm thu gom được phê duyệt hoặc hỏi nhân viên phụ trách."]'::jsonb, '["Do not place it in the five general waste bins.","Use an approved collection point or follow instructions from responsible staff."]'::jsonb, 'Không cố tháo, đập vỡ hoặc xử lý sâu vật phẩm này.', 'Do not dismantle, crush or attempt detailed handling of this item.', '[]'::jsonb),
      ('broken_glass', 'default', 'special_handling', 'Vật phẩm này cần xử lý riêng.', 'Special handling is required for this item.', '["Không bỏ vào năm thùng rác thông thường.","Dùng điểm thu gom được phê duyệt hoặc hỏi nhân viên phụ trách."]'::jsonb, '["Do not place it in the five general waste bins.","Use an approved collection point or follow instructions from responsible staff."]'::jsonb, 'Không cố tháo, đập vỡ hoặc xử lý sâu vật phẩm này.', 'Do not dismantle, crush or attempt detailed handling of this item.', '[]'::jsonb)
  ) as r(item_code, condition_key, bin_code, instruction_short_vi, instruction_short_en, preparation_steps_vi, preparation_steps_en, warning_vi, warning_en, component_actions)
)
insert into public.disposal_rules (
  site_id, item_id, condition_key, destination_bin_id, instruction_short_vi, instruction_short_en,
  instruction_detailed_vi, instruction_detailed_en, preparation_steps_vi, preparation_steps_en,
  warning_vi, warning_en, component_actions, priority, verification_status, source_reference, is_active
)
select
  site.id, items.id, rules.condition_key, bin.id, rules.instruction_short_vi, rules.instruction_short_en,
  rules.instruction_short_vi, rules.instruction_short_en, rules.preparation_steps_vi, rules.preparation_steps_en,
  rules.warning_vi, rules.warning_en, rules.component_actions, 100, 'BASED_ON_LOCAL_GUIDANCE', 'Selected-station guidance and MVP rule brief', true
from rules
join site on true
join items on items.code = rules.item_code
join bin on bin.code = rules.bin_code;

insert into public.reuse_suggestions (
  code, item_id, material_id, title_vi, title_en, summary_vi, summary_en, required_condition,
  prohibited_condition, steps_vi, steps_en, safety_note_vi, safety_note_en, difficulty,
  estimated_minutes, priority, verification_status, is_active
)
select data.code, waste_items.id, null, data.title_vi, data.title_en, data.summary_vi, data.summary_en,
  data.required_condition, data.prohibited_condition, data.steps_vi, data.steps_en,
  'Chỉ tái sử dụng khi vật phẩm sạch, khô và không sắc nhọn.', 'Reuse only when the item is clean, dry and not sharp.',
  'Easy', 10, 100, 'PENDING_CONFIRMATION', true
from (
  values
    ('plastic_bottle_planter', 'plastic_water_bottle', 'Chậu cây nhỏ', 'Reuse as a small planter', 'Cắt phần thân chai sạch để trồng cây nhỏ.', 'Use a clean bottle as a small planter.', array['empty','unbroken_clean'], array['dirty','cannot_clean'], '["Rửa sạch chai.","Để khô hoàn toàn.","Cắt phần thân khi có hỗ trợ phù hợp.","Thêm đất và cây nhỏ."]'::jsonb, '["Rinse the bottle.","Let it dry fully.","Cut the body only with appropriate help.","Add soil and a small plant."]'::jsonb),
    ('cardboard_storage', 'cardboard_box', 'Hộp lưu trữ', 'Reuse for storage', 'Giữ thùng carton sạch để lưu tài liệu hoặc vật dụng nhẹ.', 'Keep a clean cardboard box for documents or lightweight items.', array['clean_dry'], array['wet','greasy'], '["Kiểm tra thùng khô và không mốc.","Gấp lại nếu chưa dùng ngay.","Dán nhãn khi dùng để lưu trữ."]'::jsonb, '["Check that the box is dry and not mouldy.","Flatten it if you are not using it now.","Label it when used for storage."]'::jsonb),
    ('glass_vase', 'glass_drink_bottle', 'Bình hoa nhỏ', 'Reuse as a flower vase', 'Chai thủy tinh sạch có thể dùng làm bình hoa nhỏ.', 'A clean glass bottle can become a small flower vase.', array['empty','unbroken_clean'], array['dirty'], '["Rửa sạch chai.","Kiểm tra không có cạnh sắc hoặc nứt.","Thêm nước và cắm hoa."]'::jsonb, '["Wash the bottle.","Check that it has no sharp edge or crack.","Add water and flowers."]'::jsonb)
) as data(code, item_code, title_vi, title_en, summary_vi, summary_en, required_condition, prohibited_condition, steps_vi, steps_en)
join public.waste_items on waste_items.code = data.item_code
on conflict (code) do update set
  title_vi = excluded.title_vi,
  title_en = excluded.title_en,
  summary_vi = excluded.summary_vi,
  summary_en = excluded.summary_en,
  required_condition = excluded.required_condition,
  prohibited_condition = excluded.prohibited_condition,
  steps_vi = excluded.steps_vi,
  steps_en = excluded.steps_en,
  is_active = excluded.is_active;
