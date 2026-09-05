import { Battery, BottleWine, Cable, CupSoda, FileText, GlassWater, Leaf, Package, TriangleAlert, Trash2, Utensils } from 'lucide-react'

export function ItemGlyph({ objectType }: { objectType: string }) {
  const Icon = getIcon(objectType)
  return (
    <span className="item-glyph" aria-hidden="true">
      <Icon size={22} strokeWidth={1.8} />
    </span>
  )
}

function getIcon(objectType: string) {
  if (objectType.includes('bottle')) return BottleWine
  if (objectType.includes('cup')) return CupSoda
  if (objectType.includes('paper')) return FileText
  if (objectType.includes('box')) return Package
  if (objectType.includes('battery')) return Battery
  if (objectType.includes('cable')) return Cable
  if (objectType.includes('glass')) return GlassWater
  if (objectType.includes('leaf')) return Leaf
  if (objectType.includes('landfill')) return Trash2
  if (objectType.includes('alert') || objectType.includes('hazard')) return TriangleAlert
  if (objectType.includes('food') || objectType.includes('utensil')) return Utensils
  return Package
}
