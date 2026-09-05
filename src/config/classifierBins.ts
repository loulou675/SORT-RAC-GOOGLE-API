import type { BinCode } from '../types/domain'

export type ClassifierBinCode =
  | 'bottle_can'
  | 'clean_plastic'
  | 'hazardous'
  | 'landfill'
  | 'organic'
  | 'paper_cardboard'
  | 'unknown'

const itemClassifierBins: Record<string, ClassifierBinCode> = {
  aerosol_can: 'hazardous',
  aluminium_drink_can: 'bottle_can',
  battery: 'hazardous',
  cardboard_box: 'paper_cardboard',
  chemical_container: 'hazardous',
  dirty_plastic_bag: 'landfill',
  disposable_cutlery: 'landfill',
  disposable_diaper: 'landfill',
  drink_carton: 'paper_cardboard',
  electronic_cable: 'hazardous',
  food_waste: 'organic',
  fruit_peel: 'organic',
  glass_drink_bottle: 'bottle_can',
  hair_clip: 'landfill',
  hair_tie: 'landfill',
  light_bulb: 'hazardous',
  medical_mask: 'landfill',
  medicine_blister_pack: 'landfill',
  mobile_phone: 'hazardous',
  newspaper: 'paper_cardboard',
  paper_bag: 'paper_cardboard',
  paper_cup: 'landfill',
  paper_plate: 'landfill',
  paperboard_packaging: 'paper_cardboard',
  pen_marker: 'landfill',
  phone_case: 'landfill',
  plastic_bag: 'clean_plastic',
  plastic_cosmetic_container: 'landfill',
  plastic_cup_lid: 'clean_plastic',
  plastic_food_container: 'clean_plastic',
  plastic_takeaway_cup: 'clean_plastic',
  plastic_water_bottle: 'bottle_can',
  power_bank: 'hazardous',
  printing_paper: 'paper_cardboard',
  sanitary_pad: 'landfill',
  snack_wrapper: 'clean_plastic',
  steel_food_can: 'bottle_can',
  styrofoam_container: 'clean_plastic',
  tissue: 'landfill',
  unknown: 'unknown',
  vegetable_scraps: 'organic',
}

export function getClassifierBin(itemCode: string): ClassifierBinCode | undefined {
  return itemClassifierBins[itemCode]
}

export function toAppBinCode(binCode: ClassifierBinCode): BinCode | undefined {
  if (binCode === 'unknown') return undefined
  return binCode === 'hazardous' ? 'special_handling' : binCode
}
