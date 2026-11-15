import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ItemKind, ModelItem, ToolMode, ViewMode } from './types'
import type { ArchitectureTemplate } from './templates'

interface Snapshot {
  items: ModelItem[]
  selectedId: string | null
}

interface BuilderState extends Snapshot {
  projectName: string
  view: ViewMode
  night: boolean
  floorCount: number
  activeFloor: number | 'all'
  sceneRevision: number
  tool: ToolMode
  activeType: ItemKind | null
  hoveredName: string | null
  wallStart: [number, number, number] | null
  past: Snapshot[]
  future: Snapshot[]
  setView: (view: ViewMode) => void
  setActiveFloor: (floor: number | 'all') => void
  loadTemplate: (template: ArchitectureTemplate) => void
  toggleNight: () => void
  setTool: (tool: ToolMode, type?: ItemKind | null) => void
  setHoveredName: (name: string | null) => void
  setSelected: (id: string | null) => void
  setWallStart: (point: [number, number, number] | null) => void
  addItem: (item: ModelItem) => void
  updateItem: (id: string, patch: Partial<ModelItem>) => void
  editItem: (id: string, patch: Partial<ModelItem>) => void
  removeSelected: () => void
  duplicateSelected: () => void
  undo: () => void
  redo: () => void
  renameProject: (name: string) => void
}

const initialItems: ModelItem[] = [
  { id: 'floor-main', type: 'floor', name: 'Asosiy pol', position: [0, 0.04, 0], width: 8, depth: 6, height: 0.12, rotation: 0, color: '#c8b08e', material: 'wood' },
  { id: 'wall-back', type: 'wall', name: 'Orqa devor', position: [0, 1.45, -3], width: 8, depth: 0.18, height: 2.9, rotation: 0, color: '#e7e2d9', material: 'brick' },
  { id: 'wall-left', type: 'wall', name: 'Chap devor', position: [-4, 1.45, 0], width: 6, depth: 0.18, height: 2.9, rotation: Math.PI / 2, color: '#e7e2d9', material: 'brick' },
  { id: 'wall-right', type: 'wall', name: 'O‘ng devor', position: [4, 1.45, 0], width: 6, depth: 0.18, height: 2.9, rotation: Math.PI / 2, color: '#e7e2d9', material: 'brick' },
  { id: 'wall-front-a', type: 'wall', name: 'Old devor', position: [-2.7, 1.45, 3], width: 2.6, depth: 0.18, height: 2.9, rotation: 0, color: '#e7e2d9', material: 'brick' },
  { id: 'wall-front-b', type: 'wall', name: 'Old devor', position: [2.7, 1.45, 3], width: 2.6, depth: 0.18, height: 2.9, rotation: 0, color: '#e7e2d9', material: 'brick' },
  { id: 'sofa-demo', type: 'sofa', name: 'Divan', position: [-1.4, 0.45, -1.3], width: 2.2, depth: 0.9, height: 0.8, rotation: 0, color: '#b9a58f', material: 'fabric' },
  { id: 'table-demo', type: 'table', name: 'Stol', position: [1.4, 0.43, -1.25], width: 1.5, depth: 0.9, height: 0.75, rotation: 0, color: '#a77c56', material: 'wood' },
  { id: 'window-demo', type: 'window', name: 'Deraza', position: [0.2, 1.75, -2.88], width: 1.5, depth: 0.12, height: 1.2, rotation: 0, color: '#9ac2ce', material: 'glass' },
]

const snapshot = (state: Snapshot): Snapshot => ({
  items: state.items.map((item) => ({ ...item, position: [...item.position] as [number, number, number] })),
  selectedId: state.selectedId,
})

const withHistory = (state: BuilderState): Pick<BuilderState, 'past' | 'future'> => ({
  past: [...state.past.slice(-49), snapshot(state)],
  future: [],
})

export const useBuilderStore = create<BuilderState>()(persist((set, get) => ({
  items: initialItems,
  selectedId: 'sofa-demo',
  projectName: 'Villa Sokinlik',
  view: '3d',
  night: false,
  floorCount: 1,
  activeFloor: 1,
  sceneRevision: 0,
  tool: 'select',
  activeType: null,
  hoveredName: null,
  wallStart: null,
  past: [],
  future: [],
  setView: (view) => set({ view }),
  setActiveFloor: (activeFloor) => set({ activeFloor }),
  loadTemplate: (template) => set((state) => ({
    items: template.items.map((item) => ({ ...item, position: [...item.position] as [number, number, number] })),
    selectedId: null,
    projectName: template.name,
    floorCount: template.floors,
    activeFloor: 1,
    sceneRevision: state.sceneRevision + 1,
    tool: 'select',
    activeType: null,
    wallStart: null,
    past: [],
    future: [],
  })),
  toggleNight: () => set((state) => ({ night: !state.night })),
  setTool: (tool, type = null) => set({ tool, activeType: type }),
  setHoveredName: (hoveredName) => set({ hoveredName }),
  setSelected: (selectedId) => set({ selectedId }),
  setWallStart: (wallStart) => set({ wallStart }),
  addItem: (item) => set((state) => ({ ...withHistory(state), items: [...state.items, item], selectedId: item.id, tool: 'select', activeType: null })),
  updateItem: (id, patch) => set((state) => ({ items: state.items.map((item) => item.id === id ? { ...item, ...patch } : item) })),
  editItem: (id, patch) => set((state) => ({ ...withHistory(state), items: state.items.map((item) => item.id === id ? { ...item, ...patch } : item) })),
  removeSelected: () => set((state) => {
    if (!state.selectedId) return {}
    return { ...withHistory(state), items: state.items.filter((item) => item.id !== state.selectedId), selectedId: null }
  }),
  duplicateSelected: () => {
    const state = get()
    const source = state.items.find((item) => item.id === state.selectedId)
    if (!source) return
    state.addItem({ ...source, id: crypto.randomUUID(), name: `${source.name} nusxasi`, position: [source.position[0] + 0.45, source.position[1], source.position[2] + 0.45] })
  },
  undo: () => set((state) => {
    const previous = state.past[state.past.length - 1]
    if (!previous) return {}
    return { items: previous.items, selectedId: previous.selectedId, past: state.past.slice(0, -1), future: [snapshot(state), ...state.future] }
  }),
  redo: () => set((state) => {
    const next = state.future[0]
    if (!next) return {}
    return { items: next.items, selectedId: next.selectedId, past: [...state.past, snapshot(state)], future: state.future.slice(1) }
  }),
  renameProject: (projectName) => set({ projectName }),
}), {
  name: 'forma-architecture-project',
  partialize: (state) => ({ items: state.items, projectName: state.projectName, floorCount: state.floorCount, activeFloor: state.activeFloor }),
}))
