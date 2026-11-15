export type ViewMode = '3d' | '2d'
export type ToolMode = 'select' | 'wall' | 'place'
export type MaterialKind = 'wood' | 'brick' | 'glass' | 'metal' | 'concrete' | 'tile' | 'fabric' | 'grass'
export type ItemKind =
  | 'wall' | 'door' | 'window' | 'balcony' | 'stairs' | 'floor' | 'roof'
  | 'sofa' | 'bed' | 'table' | 'chair' | 'kitchen' | 'bath' | 'desk'
  | 'tree' | 'pool' | 'garage' | 'fence' | 'path' | 'lamp' | 'wardrobe' | 'toilet' | 'car'

export interface ModelItem {
  id: string
  type: ItemKind
  name: string
  position: [number, number, number]
  width: number
  depth: number
  height: number
  rotation: number
  color: string
  material: MaterialKind
}

export interface CatalogEntry {
  type: ItemKind
  name: string
  category: 'structure' | 'interior' | 'exterior'
  icon: string
  width: number
  depth: number
  height: number
  color: string
  material: MaterialKind
}
