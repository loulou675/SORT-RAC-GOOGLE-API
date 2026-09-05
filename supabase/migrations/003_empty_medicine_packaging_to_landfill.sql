-- Empty medicine packaging is treated as Landfill in the current project taxonomy.
-- Medicine remaining in the packaging still requires an appropriate collection point.

update public.waste_items
set
  name_vi = 'Vỏ thuốc rỗng',
  name_en = 'Empty medicine packaging',
  hazard_flag = false,
  special_handling = false,
  updated_at = now()
where code = 'medicine_blister_pack';

update public.disposal_rules as rule
set
  destination_bin_id = bin.id,
  instruction_short_vi = 'Đặt vỏ thuốc rỗng vào Chất Thải Chôn Lấp.',
  instruction_short_en = 'Place empty medicine packaging in Landfill.',
  instruction_detailed_vi = 'Đặt vỏ thuốc rỗng vào Chất Thải Chôn Lấp.',
  instruction_detailed_en = 'Place empty medicine packaging in Landfill.',
  preparation_steps_vi = '["Kiểm tra để chắc chắn vỏ không còn thuốc.","Đặt vỏ thuốc rỗng vào Chất Thải Chôn Lấp."]'::jsonb,
  preparation_steps_en = '["Make sure no medicine remains in the packaging.","Place the empty packaging in Landfill."]'::jsonb,
  warning_vi = 'Nếu còn thuốc hoặc thuốc đã hết hạn, không bỏ vào Landfill; hãy dùng điểm thu gom thuốc phù hợp.',
  warning_en = 'If medicine remains or has expired, do not use Landfill; use an appropriate medicine collection point.',
  updated_at = now()
from public.waste_items as item
join public.bins as bin on bin.code = 'landfill'
where rule.item_id = item.id
  and item.code = 'medicine_blister_pack'
  and bin.site_id = rule.site_id;

insert into public.disposal_rules (
  site_id,
  item_id,
  condition_key,
  destination_bin_id,
  instruction_short_vi,
  instruction_short_en,
  instruction_detailed_vi,
  instruction_detailed_en,
  preparation_steps_vi,
  preparation_steps_en,
  warning_vi,
  warning_en,
  component_actions,
  priority,
  verification_status,
  source_reference,
  is_active
)
select
  site.id,
  item.id,
  'default',
  bin.id,
  'Đặt vỏ thuốc rỗng vào Chất Thải Chôn Lấp.',
  'Place empty medicine packaging in Landfill.',
  'Đặt vỏ thuốc rỗng vào Chất Thải Chôn Lấp.',
  'Place empty medicine packaging in Landfill.',
  '["Kiểm tra để chắc chắn vỏ không còn thuốc.","Đặt vỏ thuốc rỗng vào Chất Thải Chôn Lấp."]'::jsonb,
  '["Make sure no medicine remains in the packaging.","Place the empty packaging in Landfill."]'::jsonb,
  'Nếu còn thuốc hoặc thuốc đã hết hạn, không bỏ vào Landfill; hãy dùng điểm thu gom thuốc phù hợp.',
  'If medicine remains or has expired, do not use Landfill; use an appropriate medicine collection point.',
  '[]'::jsonb,
  100,
  'BASED_ON_LOCAL_GUIDANCE',
  'Current project sorting rule',
  true
from public.site_profiles as site
join public.waste_items as item on item.code = 'medicine_blister_pack'
join public.bins as bin on bin.site_id = site.id and bin.code = 'landfill'
where not exists (
  select 1
  from public.disposal_rules as existing
  where existing.site_id = site.id
    and existing.item_id = item.id
    and existing.condition_key = 'default'
);
