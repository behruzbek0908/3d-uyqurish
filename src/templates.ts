import type { ItemKind, MaterialKind, ModelItem } from './types'

export interface ArchitectureTemplate {
  id: string
  name: string
  subtitle: string
  description: string
  floors: number
  area: string
  features: string[]
  items: ModelItem[]
}

type EntrySide = 'front' | 'left' | 'right'

interface ApartmentOptions {
  prefix: string
  centerX: number
  centerZ: number
  floorY: number
  width: number
  depth: number
  entrySide?: EntrySide
  vip?: boolean
}

function createItemFactory(prefix: string) {
  let nextId = 0
  return (
    type: ItemKind,
    name: string,
    position: [number, number, number],
    width: number,
    depth: number,
    height: number,
    color: string,
    material: MaterialKind,
    rotation = 0,
  ): ModelItem => ({
    id: `${prefix}-${++nextId}`,
    type,
    name,
    position,
    width,
    depth,
    height,
    rotation,
    color,
    material,
  })
}

function addThreeRoomApartment(items: ModelItem[], options: ApartmentOptions) {
  const { prefix, centerX: x, centerZ: z, floorY: y, width: w, depth: d } = options
  const add = createItemFactory(prefix)
  const halfW = w / 2
  const halfD = d / 2
  const wallY = y + 1.4
  const entrySide = options.entrySide ?? 'front'
  const doorX = entrySide === 'front' ? x : x + (entrySide === 'left' ? -halfW : halfW)
  const doorZ = entrySide === 'front' ? z + halfD : z
  const doorRotation = entrySide === 'front' ? 0 : Math.PI / 2

  items.push(add('floor', 'Xonadon pol paneli', [x, y + 0.04, z], w, d, 0.12, '#c8b08e', 'wood'))
  items.push(add('floor', 'Asosiy yotoqxona pol qoplamasi', [x - w * 0.36, y + 0.08, z - d * 0.25], w * 0.26, d * 0.45, 0.04, '#c9b394', 'wood'))
  items.push(add('floor', 'Ikkinchi yotoqxona pol qoplamasi', [x - w * 0.36, y + 0.08, z + d * 0.25], w * 0.26, d * 0.45, 0.04, '#c7b9a2', 'wood'))
  items.push(add('floor', 'Zal pol qoplamasi', [x + w * 0.2, y + 0.08, z - d * 0.16], w * 0.55, d * 0.63, 0.04, '#c6ab87', 'wood'))
  items.push(add('floor', 'Oshxona pol qoplamasi', [x - w * 0.2, y + 0.08, z + d * 0.37], w * 0.35, d * 0.22, 0.04, '#d0c8b8', 'tile'))
  items.push(add('floor', 'Sanuzel pol qoplamasi', [x + w * 0.3, y + 0.08, z + d * 0.37], w * 0.22, d * 0.22, 0.04, '#becfd0', 'tile'))
  items.push(add('floor', 'Koridor pol qoplamasi', [x + w * 0.06, y + 0.08, z + d * 0.29], w * 0.28, d * 0.15, 0.04, '#bda98f', 'wood'))
  items.push(add('wall', 'Orqa tashqi devor', [x, wallY, z - halfD], w, 0.18, 2.8, '#e7e2d9', 'brick'))
  items.push(add('wall', 'Chap tashqi devor', [x - halfW, wallY, z], d, 0.18, 2.8, '#e7e2d9', 'brick', Math.PI / 2))
  items.push(add('wall', 'O‘ng tashqi devor', [x + halfW, wallY, z], d, 0.18, 2.8, '#e7e2d9', 'brick', Math.PI / 2))

  if (entrySide === 'front') {
    items.push(add('wall', 'Old tashqi devor', [x - w * 0.34, wallY, z + halfD], w * 0.32, 0.18, 2.8, '#e7e2d9', 'brick'))
    items.push(add('wall', 'Old tashqi devor', [x + w * 0.34, wallY, z + halfD], w * 0.32, 0.18, 2.8, '#e7e2d9', 'brick'))
  } else {
    items.push(add('wall', 'Balkon tomondagi tashqi devor', [x, wallY, z + halfD], w, 0.18, 2.8, '#e7e2d9', 'brick'))
    const sideX = x + (entrySide === 'left' ? -halfW : halfW)
    const segmentLength = (d - 1.1) / 2
    for (const direction of [-1, 1]) {
      items.push(add('wall', 'Yon tashqi devor', [sideX, wallY, z + direction * (0.55 + segmentLength / 2)], segmentLength, 0.18, 2.8, '#e7e2d9', 'brick', Math.PI / 2))
    }
  }

  const dividerX = x - w * 0.14
  items.push(add('wall', 'Zal va yotoqxonalar devori', [dividerX, wallY, z - d * 0.19], d * 0.54, 0.16, 2.8, '#ded8ce', 'brick', Math.PI / 2))
  items.push(add('wall', 'Yotoqxonalar ajratmasi', [x - w * 0.31, wallY, z + d * 0.03], w * 0.35, 0.16, 2.8, '#ded8ce', 'brick'))
  items.push(add('wall', 'Oshxona va koridor ajratmasi', [x + w * 0.18, wallY, z + d * 0.26], w * 0.46, 0.16, 2.8, '#ded8ce', 'brick'))
  items.push(add('wall', 'Sanuzel ajratmasi', [x - w * 0.02, wallY, z + d * 0.31], d * 0.22, 0.16, 2.8, '#ded8ce', 'brick', Math.PI / 2))

  items.push(add('door', 'Kirish eshigi', [doorX, y + 1.05, doorZ], 0.95, 0.12, 2.1, '#9b6b45', 'wood', doorRotation))
  items.push(add('door', 'Yotoqxona eshigi', [dividerX, y + 1.05, z - d * 0.04], 0.85, 0.12, 2.1, '#a97d5c', 'wood', Math.PI / 2))
  items.push(add('door', 'Sanuzel eshigi', [x + w * 0.04, y + 1.05, z + d * 0.2], 0.75, 0.12, 2.1, '#a97d5c', 'wood'))
  items.push(add('window', 'Zal derazasi', [x + w * 0.27, y + 1.72, z - halfD + 0.06], 1.65, 0.12, 1.2, '#9ac2ce', 'glass'))
  items.push(add('window', 'Yotoqxona derazasi', [x - halfW + 0.06, y + 1.72, z - d * 0.22], 1.4, 0.12, 1.2, '#9ac2ce', 'glass', Math.PI / 2))
  items.push(add('window', 'Oshxona derazasi', [x - w * 0.28, y + 1.72, z + halfD - 0.06], 1.15, 0.12, 1.2, '#9ac2ce', 'glass'))
  items.push(add('balcony', 'Balkon', [x + w * 0.29, y + 0.35, z + halfD + 0.65], 2.5, 1.3, 1, '#b7b9b8', 'metal'))

  const bedHeight = 0.65
  items.push(add('bed', 'Asosiy yotoqxona krovat', [x - w * 0.34, y + bedHeight / 2, z - d * 0.25], 2, 1.6, bedHeight, '#c5b7a4', 'fabric'))
  items.push(add('wardrobe', 'Yotoqxona shkafi', [x - halfW + 0.7, y + 1.05, z - d * 0.04], 1.5, 0.58, 2.1, '#9b7354', 'wood'))
  items.push(add('bed', 'Ikkinchi yotoqxona krovat', [x - w * 0.34, y + bedHeight / 2, z + d * 0.25], 1.8, 1.45, bedHeight, '#b9a58f', 'fabric'))
  items.push(add('wardrobe', 'Ikkinchi yotoqxona shkafi', [x - halfW + 0.65, y + 1, z + d * 0.4], 1.35, 0.55, 2, '#a17a5d', 'wood'))
  items.push(add('sofa', 'Zal divani', [x + w * 0.23, y + 0.4, z - d * 0.13], 2.3, 0.95, 0.8, '#b9a58f', 'fabric'))
  items.push(add('table', 'Zal jurnali stoli', [x + w * 0.24, y + 0.38, z + d * 0.1], 1.2, 0.75, 0.72, '#a77c56', 'wood'))
  items.push(add('kitchen', 'Oshxona garnituri', [x - w * 0.3, y + 0.45, z + d * 0.39], 2.8, 0.65, 0.9, '#d8d6d1', 'concrete'))
  items.push(add('table', 'Oshxona ovqatlanish stoli', [x - w * 0.07, y + 0.4, z + d * 0.39], 1.25, 0.8, 0.75, '#a77c56', 'wood'))
  items.push(add('chair', 'Oshxona stuli 1', [x - w * 0.17, y + 0.45, z + d * 0.28], 0.52, 0.52, 0.9, '#9b7354', 'wood'))
  items.push(add('chair', 'Oshxona stuli 2', [x + w * 0.03, y + 0.45, z + d * 0.45], 0.52, 0.52, 0.9, '#9b7354', 'wood'))
  items.push(add('bath', 'Sanuzel vannasi', [x + w * 0.32, y + 0.32, z + d * 0.39], 1.7, 0.75, 0.65, '#d6e5e6', 'glass'))
  items.push(add('toilet', 'Hojatxona', [x + w * 0.32, y + 0.22, z + d * 0.3], 0.52, 0.68, 0.45, '#edf1ee', 'tile'))
  items.push(add('lamp', 'Zal chirog‘i', [x + w * 0.22, y + 1.05, z - d * 0.08], 0.35, 0.35, 2.1, '#d7bd77', 'metal'))
  items.push(add('lamp', 'Yotoqxona chirog‘i', [x - w * 0.34, y + 1.05, z - d * 0.25], 0.35, 0.35, 2.1, '#d7bd77', 'metal'))
  items.push(add('lamp', 'Ikkinchi yotoqxona chirog‘i', [x - w * 0.34, y + 1.05, z + d * 0.25], 0.35, 0.35, 2.1, '#d7bd77', 'metal'))
  items.push(add('lamp', 'Oshxona chirog‘i', [x - w * 0.2, y + 1.05, z + d * 0.34], 0.35, 0.35, 2.1, '#d7bd77', 'metal'))
  items.push(add('lamp', 'Sanuzel chirog‘i', [x + w * 0.3, y + 1.05, z + d * 0.37], 0.35, 0.35, 2.1, '#d7bd77', 'metal'))
  items.push(add('lamp', 'Koridor chirog‘i', [x + w * 0.07, y + 1.05, z + d * 0.25], 0.35, 0.35, 2.1, '#d7bd77', 'metal'))
}

function addVipApartment(items: ModelItem[], prefix: string) {
  const add = createItemFactory(prefix)
  const x = 0
  const z = 0
  const wallY = 1.4
  items.push(add('floor', 'VIP xonadon pol paneli', [x, 0.04, z], 14, 11, 0.12, '#c8b08e', 'wood'))
  items.push(add('floor', 'Katta zal pol qoplamasi', [3.2, 0.08, -2.1], 6.8, 6.1, 0.04, '#c6ab87', 'wood'))
  items.push(add('floor', 'Ota-onalar xonasi pol qoplamasi', [-4.3, 0.08, -2.5], 5, 4.4, 0.04, '#c9b394', 'wood'))
  items.push(add('floor', 'Bolalar xonasi pol qoplamasi', [-4.3, 0.08, 2.6], 5, 4.3, 0.04, '#c7b9a2', 'wood'))
  items.push(add('floor', 'Kabinet pol qoplamasi', [4.6, 0.08, 0], 4.5, 5, 0.04, '#bda98f', 'wood'))
  items.push(add('floor', 'Oshxona pol qoplamasi', [-3.1, 0.08, 4.35], 4.8, 2, 0.04, '#d0c8b8', 'tile'))
  items.push(add('floor', 'Umumiy sanuzel pol qoplamasi', [-0.5, 0.08, 4.25], 2.2, 2.1, 0.04, '#becfd0', 'tile'))
  items.push(add('floor', 'Ota-onalar sanuzeli pol qoplamasi', [2.4, 0.08, 4.25], 2.3, 2.1, 0.04, '#becfd0', 'tile'))
  items.push(add('floor', 'Koridor pol qoplamasi', [0, 0.08, 2.7], 4, 1, 0.04, '#bda98f', 'wood'))
  items.push(add('wall', 'Orqa tashqi devor', [x, wallY, -5.5], 14, 0.18, 2.8, '#e7e2d9', 'brick'))
  items.push(add('wall', 'Chap tashqi devor', [-7, wallY, z], 11, 0.18, 2.8, '#e7e2d9', 'brick', Math.PI / 2))
  items.push(add('wall', 'O‘ng tashqi devor', [7, wallY, z], 11, 0.18, 2.8, '#e7e2d9', 'brick', Math.PI / 2))
  items.push(add('wall', 'Old devor chap qanoti', [-4.3, wallY, 5.5], 5.4, 0.18, 2.8, '#e7e2d9', 'brick'))
  items.push(add('wall', 'Old devor o‘ng qanoti', [4.3, wallY, 5.5], 5.4, 0.18, 2.8, '#e7e2d9', 'brick'))
  items.push(add('wall', 'Xonalar ajratmasi', [-1, wallY, -1.5], 8, 0.16, 2.8, '#ded8ce', 'brick', Math.PI / 2))
  items.push(add('wall', 'Yotoqxonalar ajratmasi', [-4, wallY, 0.25], 6, 0.16, 2.8, '#ded8ce', 'brick'))
  items.push(add('wall', 'Kabinet ajratmasi', [3.2, wallY, -0.4], 4.7, 0.16, 2.8, '#ded8ce', 'brick', Math.PI / 2))
  items.push(add('wall', 'Oshxona va sanuzel ajratmasi', [1, wallY, 3.05], 12, 0.16, 2.8, '#ded8ce', 'brick'))
  items.push(add('wall', 'Sanuzel ajratmasi', [-2.2, wallY, 4], 3, 0.16, 2.8, '#ded8ce', 'brick', Math.PI / 2))
  items.push(add('door', 'Kirish eshigi', [0, 1.05, 5.5], 1, 0.12, 2.1, '#9b6b45', 'wood'))
  items.push(add('door', 'Ota-onalar yotoqxonasi eshigi', [-1, 1.05, 0.3], 0.9, 0.12, 2.1, '#a97d5c', 'wood', Math.PI / 2))
  items.push(add('door', 'Bolalar xonasi eshigi', [-4, 1.05, 1.8], 0.85, 0.12, 2.1, '#a97d5c', 'wood'))
  items.push(add('door', 'Kabinet eshigi', [3.2, 1.05, 1.2], 0.85, 0.12, 2.1, '#a97d5c', 'wood', Math.PI / 2))
  items.push(add('door', 'Sanuzel eshigi', [0.2, 1.05, 3.05], 0.8, 0.12, 2.1, '#a97d5c', 'wood'))
  items.push(add('window', 'Panoramali zal derazasi', [3.7, 1.75, -5.44], 2.5, 0.12, 1.35, '#9ac2ce', 'glass'))
  items.push(add('window', 'Yotoqxona derazasi', [-6.94, 1.75, -2.2], 1.7, 0.12, 1.2, '#9ac2ce', 'glass', Math.PI / 2))
  items.push(add('window', 'Bolalar xonasi derazasi', [-6.94, 1.75, 2.4], 1.5, 0.12, 1.2, '#9ac2ce', 'glass', Math.PI / 2))
  items.push(add('window', 'Oshxona derazasi', [-2.4, 1.75, 5.44], 1.45, 0.12, 1.2, '#9ac2ce', 'glass'))
  items.push(add('balcony', 'Keng VIP terassa', [3.8, 0.35, 6.65], 5.5, 2.3, 1, '#b7b9b8', 'metal'))

  items.push(add('sofa', 'Katta zal divani', [2.4, 0.4, -2.3], 3, 1.05, 0.82, '#9d8b7b', 'fabric'))
  items.push(add('table', 'Zal markaziy stoli', [2.5, 0.38, -0.45], 1.5, 0.9, 0.72, '#a77c56', 'wood'))
  items.push(add('bed', 'Ota-onalar krovat', [-4, 0.33, -2.2], 2.1, 1.8, 0.66, '#c5b7a4', 'fabric'))
  items.push(add('wardrobe', 'Ota-onalar shkafi', [-6.1, 1.05, -0.2], 1.7, 0.6, 2.1, '#9b7354', 'wood'))
  items.push(add('bed', 'Bolalar krovat', [-4.1, 0.33, 2.6], 1.9, 1.45, 0.66, '#b9a58f', 'fabric'))
  items.push(add('wardrobe', 'Bolalar xonasi shkafi', [-5.9, 0.95, 4.25], 1.35, 0.55, 1.9, '#a17a5d', 'wood'))
  items.push(add('desk', 'Ish kabineti stoli', [4.9, 0.38, 0.25], 1.7, 0.8, 0.76, '#a77c56', 'wood'))
  items.push(add('chair', 'Kabinet kreslosi', [4.9, 0.45, 1.25], 0.65, 0.65, 0.9, '#9b7354', 'wood'))
  items.push(add('wardrobe', 'Kabinet kitob javoni', [6.15, 1.05, -1.6], 0.55, 2.4, 2.1, '#8e7158', 'wood'))
  items.push(add('kitchen', 'Katta oshxona garnituri', [-4.3, 0.45, 4.6], 3.2, 0.7, 0.9, '#d8d6d1', 'concrete'))
  items.push(add('table', 'Oshxona ovqatlanish stoli', [-0.8, 0.4, 4.4], 1.7, 0.95, 0.75, '#a77c56', 'wood'))
  items.push(add('chair', 'Oshxona stuli 1', [-1.4, 0.45, 3.8], 0.55, 0.55, 0.9, '#9b7354', 'wood'))
  items.push(add('chair', 'Oshxona stuli 2', [-0.2, 0.45, 5], 0.55, 0.55, 0.9, '#9b7354', 'wood'))
  items.push(add('bath', 'Umumiy sanuzel vannasi', [-1, 0.32, 3.9], 1.7, 0.75, 0.65, '#d6e5e6', 'glass'))
  items.push(add('toilet', 'Umumiy sanuzel hojatxonasi', [-3.3, 0.22, 4.3], 0.52, 0.68, 0.45, '#edf1ee', 'tile'))
  items.push(add('bath', 'Ota-onalar sanuzeli dushi', [1.1, 0.28, 4.2], 1.25, 1.1, 0.55, '#b7d4d8', 'glass'))
  items.push(add('toilet', 'Ota-onalar sanuzeli hojatxonasi', [2.7, 0.22, 4.2], 0.52, 0.68, 0.45, '#edf1ee', 'tile'))
  for (const [name, position] of [
    ['Zal lyustrasi', [2, 1.05, -1.4]],
    ['Ota-onalar xonasi chirog‘i', [-4, 1.05, -2.2]],
    ['Bolalar xonasi chirog‘i', [-4.1, 1.05, 2.6]],
    ['Kabinet chirog‘i', [4.8, 1.05, -0.3]],
    ['Oshxona chirog‘i', [-2.2, 1.05, 4.2]],
    ['Umumiy sanuzel chirog‘i', [-1, 1.05, 4.4]],
    ['Ota-onalar sanuzeli chirog‘i', [2.4, 1.05, 4.4]],
    ['Koridor chirog‘i', [0, 1.05, 2.5]],
  ] as [string, [number, number, number]][]) {
    items.push(add('lamp', name, position, 0.35, 0.35, 2.1, '#d7bd77', 'metal'))
  }
}

function createThreeRoomTemplate(): ArchitectureTemplate {
  const items: ModelItem[] = []
  addThreeRoomApartment(items, { prefix: 'modern', centerX: 0, centerZ: 0, floorY: 0, width: 12, depth: 9 })
  return {
    id: 'modern-three-room',
    name: '3 xonali zamonaviy kvartira',
    subtitle: '1-qavat maketi',
    description: 'Keng zal, ikki yotoqxona, alohida oshxona, sanuzel, koridor va jihozlangan balkon.',
    floors: 1,
    area: '108 m²',
    features: ['2 yotoqxona', 'Alohida oshxona', 'Balkon'],
    items,
  }
}

function createVipTemplate(): ArchitectureTemplate {
  const items: ModelItem[] = []
  addVipApartment(items, 'penthouse')
  return {
    id: 'vip-penthouse',
    name: '4 xonali keng kvartira',
    subtitle: 'Penthouse / VIP',
    description: 'Katta zal, ota-onalar va bolalar xonasi, ish kabineti, ikki sanuzel va keng terassa.',
    floors: 1,
    area: '154 m²',
    features: ['Ish kabineti', '2 sanuzel', 'Keng terassa'],
    items,
  }
}

function createApartmentBuildingTemplate(): ArchitectureTemplate {
  const items: ModelItem[] = []
  const storyHeight = 3.2
  for (let floor = 0; floor < 4; floor += 1) {
    const floorY = floor * storyHeight
    addThreeRoomApartment(items, {
      prefix: `tower-${floor + 1}-left`,
      centerX: -5.05,
      centerZ: 0,
      floorY,
      width: 9.8,
      depth: 9.8,
      entrySide: 'right',
    })
    addThreeRoomApartment(items, {
      prefix: `tower-${floor + 1}-right`,
      centerX: 5.05,
      centerZ: 0,
      floorY,
      width: 9.8,
      depth: 9.8,
      entrySide: 'left',
    })
    const add = createItemFactory(`tower-common-${floor + 1}`)
    items.push(add('floor', 'Umumiy podyezd maydoni', [0, floorY + 0.04, 0], 2.2, 9.8, 0.12, '#aaa69c', 'concrete'))
    items.push(add('stairs', 'Podyezd zinapoyasi', [0, floorY, -1.4], 1.8, 2.8, 2.8, '#c4b8a7', 'concrete'))
    items.push(add('lamp', 'Podyezd yoritgichi', [0, floorY + 1.05, 3.7], 0.35, 0.35, 2.1, '#d7bd77', 'metal'))
    items.push(add('window', 'Podyezd derazasi', [0, floorY + 1.72, -4.84], 1.1, 0.12, 1.2, '#9ac2ce', 'glass'))
  }

  const yard = createItemFactory('tower-courtyard')
  items.push(yard('floor', 'Ko‘kalamzor hovli', [0, -0.12, 0], 28, 22, 0.16, '#92a57e', 'grass'))
  items.push(yard('path', 'Hovli piyodalar yo‘lagi', [0, 0.01, 7.6], 18, 1.2, 0.08, '#b9b4ac', 'concrete'))
  items.push(yard('path', 'Avtoturargoh qoplamasi', [0, 0.02, -8], 20, 4.4, 0.1, '#777f80', 'concrete'))
  for (const [index, x] of [-7, -3, 3, 7].entries()) {
    const carColors = ['#71818a', '#a96f58', '#d2bd8c', '#657965']
    items.push(yard('car', 'Avtoturargohdagi avtomobil', [x, 0.55, -8], 2.4, 3.8, 1.1, carColors[index], 'metal'))
  }
  for (const [x, z] of [[-11, -6], [-11, 4], [11, -6], [11, 4], [-7, 9], [7, 9], [-12, 0], [12, 0]]) {
    items.push(yard('tree', 'Hovli daraxti', [x, 1.6, z], 1.7, 1.7, 3.2, '#607c59', 'grass'))
  }
  items.push(yard('path', 'Bolalar maydonchasi qoplamasi', [0, 0.08, 10.1], 7, 4, 0.12, '#d8c49b', 'concrete'))
  items.push(yard('sofa', 'Bolalar maydonchasi o‘rindig‘i', [-2.2, 0.35, 10.4], 1.8, 0.55, 0.7, '#c47c4c', 'wood'))
  items.push(yard('lamp', 'Hovli chirog‘i 1', [-9, 1.05, 8], 0.35, 0.35, 2.1, '#d7bd77', 'metal'))
  items.push(yard('lamp', 'Hovli chirog‘i 2', [9, 1.05, 8], 0.35, 0.35, 2.1, '#d7bd77', 'metal'))
  items.push(yard('roof', 'Bino tomi', [0, storyHeight * 4 + 0.45, 0], 20.2, 12, 0.9, '#626b73', 'metal'))

  return {
    id: 'four-floor-residence',
    name: 'Ko‘p qavatli turar-joy binosi',
    subtitle: '4 qavatli dom',
    description: 'To‘rt qavat, har qavatda ikkita 3 xonali xonadon, podyezd, zinapoya va obodonlashtirilgan hovli.',
    floors: 4,
    area: '4 × 2 xonadon',
    features: ['4 qavat', '8 ta xonadon', 'Hovli va parking'],
    items,
  }
}

export const architectureTemplates: ArchitectureTemplate[] = [
  createThreeRoomTemplate(),
  createVipTemplate(),
  createApartmentBuildingTemplate(),
]
