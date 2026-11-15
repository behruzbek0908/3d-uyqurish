import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { Grid, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useBuilderStore } from '../store'
import { catalog } from '../catalog'
import type { CatalogEntry, ModelItem } from '../types'

const snap = (value: number) => Math.round(value * 2) / 2

function Surface() {
  const { view, tool, activeType, wallStart, night, items, setWallStart, addItem, setSelected, setTool } = useBuilderStore()
  const [pointer, setPointer] = useState<[number, number, number] | null>(null)

  const onMove = (event: ThreeEvent<PointerEvent>) => setPointer([snap(event.point.x), 0.05, snap(event.point.z)])
  const onClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    const x = snap(event.point.x)
    const z = snap(event.point.z)
    if (tool === 'wall') {
      if (!wallStart) {
        setWallStart([x, 0, z])
        return
      }
      const dx = x - wallStart[0]
      const dz = z - wallStart[2]
      const length = Math.hypot(dx, dz)
      if (length > 0.35) {
        const rotation = Math.atan2(-dz, dx)
        const wall: CatalogEntry = { type: 'wall', name: 'Devor', category: 'structure', icon: '', width: length, depth: 0.18, height: 2.8, color: '#e5ddd0', material: 'brick' }
        addItem({ ...wall, id: crypto.randomUUID(), position: [(x + wallStart[0]) / 2, wall.height / 2, (z + wallStart[2]) / 2], rotation })
      }
      setWallStart(null)
      return
    }
    if (tool === 'place' && activeType) {
      const entry = catalog.find((item) => item.type === activeType)
      if (!entry) return
      const nearestWall = items
        .filter((item) => item.type === 'wall')
        .map((item) => ({ item, distance: Math.hypot(item.position[0] - x, item.position[2] - z) }))
        .filter(({ distance }) => distance < 1.1)
        .sort((a, b) => a.distance - b.distance)[0]?.item
      const rotation = nearestWall && ['door', 'window', 'balcony'].includes(activeType) ? nearestWall.rotation : 0
      const itemHeight = entry.height
      const positionY = activeType === 'floor' ? 0.06 : itemHeight / 2
      addItem({
        id: crypto.randomUUID(),
        type: activeType,
        name: entry.name,
        position: [x, positionY, z],
        width: entry.width,
        depth: entry.depth,
        height: entry.height,
        rotation,
        color: entry.color,
        material: entry.material,
      })
      return
    }
    setSelected(null)
    setTool('select')
  }

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} onPointerMove={onMove} onClick={onClick} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={night ? '#171c21' : '#f0f0ec'} />
      </mesh>
      <Grid
        position={[0, 0, 0]}
        args={[80, 80]}
        cellSize={view === '2d' ? 1 : 0.5}
        cellThickness={view === '2d' ? 0.75 : 0.45}
        cellColor={night ? '#4a5053' : '#c9cbc8'}
        sectionSize={4}
        sectionThickness={1}
        sectionColor={night ? '#687077' : '#a9ada9'}
        fadeDistance={40}
        infiniteGrid
      />
      {pointer && tool === 'wall' && wallStart && (
        <mesh position={[(wallStart[0] + pointer[0]) / 2, 1.4, (wallStart[2] + pointer[2]) / 2]}>
          <boxGeometry args={[Math.max(0.1, Math.hypot(pointer[0] - wallStart[0], pointer[2] - wallStart[2])), 2.8, 0.08]} />
          <meshBasicMaterial color="#bb7950" transparent opacity={0.45} />
        </mesh>
      )}
      {pointer && tool === 'wall' && <mesh position={pointer}><sphereGeometry args={[0.08, 12, 12]} /><meshBasicMaterial color="#bf7951" /></mesh>}
    </>
  )
}

function ItemMesh({ item }: { item: ModelItem }) {
  const selected = useBuilderStore((state) => state.selectedId === item.id)
  const setSelected = useBuilderStore((state) => state.setSelected)
  const setHoveredName = useBuilderStore((state) => state.setHoveredName)
  const updateItem = useBuilderStore((state) => state.updateItem)
  const draggingRef = useRef(false)
  const hoveringRef = useRef(false)
  const dragOffset = useRef(new THREE.Vector3())
  const { controls } = useThree()
  const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const hitPoint = useMemo(() => new THREE.Vector3(), [])
  const setOrbitEnabled = (enabled: boolean) => {
    if (controls && 'enabled' in controls && typeof controls.enabled === 'boolean') {
      controls.enabled = enabled
    }
  }
  const canvas = () => document.querySelector<HTMLCanvasElement>('.canvas-holder canvas')
  const updateCursor = (cursor: 'grab' | 'grabbing' | '') => {
    const element = canvas()
    if (element) element.style.cursor = cursor
  }
  const finishDrag = () => {
    if (!draggingRef.current) return
    draggingRef.current = false
    setOrbitEnabled(!hoveringRef.current)
    updateCursor(hoveringRef.current ? 'grab' : '')
    window.dispatchEvent(new CustomEvent('forma:drag', { detail: { dragging: false } }))
  }
  const finishDragRef = useRef(finishDrag)
  finishDragRef.current = finishDrag

  const onDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    event.nativeEvent.stopPropagation()
    event.nativeEvent.preventDefault()
    setSelected(item.id)
    if (useBuilderStore.getState().tool === 'select') {
      dragPlane.set(new THREE.Vector3(0, 1, 0), -item.position[1])
      const point = event.ray.intersectPlane(dragPlane, hitPoint)
      if (point) dragOffset.current.set(item.position[0] - point.x, 0, item.position[2] - point.z)
      draggingRef.current = true
      setOrbitEnabled(false)
      updateCursor('grabbing')
      window.dispatchEvent(new CustomEvent('forma:drag', { detail: { dragging: true } }))
      const element = event.nativeEvent.currentTarget
      if (element instanceof HTMLCanvasElement) element.setPointerCapture(event.pointerId)
    }
  }
  const onMove = (event: ThreeEvent<PointerEvent>) => {
    if (!draggingRef.current) return
    event.stopPropagation()
    event.nativeEvent.stopPropagation()
    const point = event.ray.intersectPlane(dragPlane, hitPoint)
    if (point) updateItem(item.id, { position: [snap(point.x + dragOffset.current.x), item.position[1], snap(point.z + dragOffset.current.z)] })
  }
  const onUp = (event: ThreeEvent<PointerEvent>) => {
    if (!draggingRef.current) return
    event.stopPropagation()
    event.nativeEvent.stopPropagation()
    const element = event.nativeEvent.currentTarget
    if (element instanceof HTMLCanvasElement && element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId)
    finishDrag()
  }
  useEffect(() => {
    const onGlobalPointerUp = () => finishDragRef.current()
    window.addEventListener('pointerup', onGlobalPointerUp)
    window.addEventListener('pointercancel', onGlobalPointerUp)
    return () => {
      window.removeEventListener('pointerup', onGlobalPointerUp)
      window.removeEventListener('pointercancel', onGlobalPointerUp)
    }
  }, [])

  const box = (size: [number, number, number], pos: [number, number, number], color = item.color) => (
    <mesh key={`${size.join(',')}-${pos.join(',')}`} position={pos} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={item.material === 'glass' ? 0.18 : 0.72} metalness={item.material === 'metal' ? 0.5 : 0.04} transparent={item.material === 'glass'} opacity={item.material === 'glass' ? 0.66 : 1} />
    </mesh>
  )
  const furniture = () => {
    switch (item.type) {
      case 'sofa':
        return <>{box([item.width, item.height * 0.58, item.depth], [0, item.height * 0.29, 0])}{box([item.width, item.height * 0.48, item.depth * 0.24], [0, item.height * 0.74, -item.depth * 0.38])}{[-1, 1].map((side) => box([item.width * 0.1, item.height * 0.68, item.depth], [side * item.width * 0.45, item.height * 0.34, 0]))}</>
      case 'bed':
        return <>{box([item.width, item.height * 0.5, item.depth], [0, item.height * 0.25, 0])}{box([item.width * 0.98, item.height * 0.42, item.depth * 0.78], [0, item.height * 0.7, 0.05], '#eee9df')}{box([item.width, item.height * 0.2, 0.12], [0, item.height * 0.65, -item.depth * 0.45])}</>
      case 'wardrobe':
        return <>{box([item.width, item.height, item.depth], [0, 0, 0])}{box([0.035, item.height * 0.9, 0.035], [0, 0, item.depth / 2 + 0.02], '#d1c5b7')}</>
      case 'toilet':
        return <>{box([item.width * 0.8, item.height * 0.42, item.depth * 0.58], [0, item.height * 0.2, 0], '#edf1ee')}{box([item.width * 0.86, item.height * 0.18, item.depth * 0.4], [0, item.height * 0.82, -item.depth * 0.28], '#f8faf8')}</>
      case 'table':
      case 'desk':
        return <>{box([item.width, 0.12, item.depth], [0, item.height * 0.82, 0])}{[-1, 1].flatMap((x) => [-1, 1].map((z) => box([0.09, item.height * 0.8, 0.09], [x * item.width * 0.42, item.height * 0.4, z * item.depth * 0.4])))}</>
      case 'chair':
        return <>{box([item.width, 0.1, item.depth], [0, item.height * 0.48, 0])}{box([item.width, item.height * 0.52, 0.1], [0, item.height * 0.76, -item.depth * 0.43])}{[-1, 1].flatMap((x) => [-1, 1].map((z) => box([0.06, item.height * 0.48, 0.06], [x * item.width * 0.4, item.height * 0.24, z * item.depth * 0.4])))}</>
      case 'tree':
        return <><mesh position={[0, item.height * 0.3, 0]} castShadow><cylinderGeometry args={[0.12, 0.18, item.height * 0.6, 8]} /><meshStandardMaterial color="#785c43" /></mesh><mesh position={[0, item.height * 0.72, 0]} castShadow><coneGeometry args={[item.width * 0.55, item.height * 0.68, 8]} /><meshStandardMaterial color={item.color} /></mesh></>
      case 'lamp':
        return <>{box([0.09, item.height * 0.88, 0.09], [0, item.height * 0.44, 0])}{box([item.width * 1.4, 0.18, item.depth * 1.4], [0, item.height * 0.91, 0], '#e9d496')}{useBuilderStore.getState().night && <pointLight position={[0, item.height * 0.92, 0]} color="#ffd98c" intensity={3} distance={5} />}</>
      case 'stairs':
        return <>{Array.from({ length: 6 }, (_, index) => box([item.width, item.height / 6, item.depth / 6], [0, item.height * (index + 0.5) / 6, item.depth * (index - 2.5) / 6]))}</>
      case 'window':
        return <>{box([item.width, item.height, 0.07], [0, 0, 0], item.color)}{box([0.045, item.height, 0.09], [0, 0, 0], '#e7e5df')}{box([item.width, 0.045, 0.09], [0, 0, 0], '#e7e5df')}</>
      case 'pool':
        return <>{box([item.width, item.height * 0.25, item.depth], [0, item.height * 0.12, 0], '#748d91')}{box([item.width * 0.92, 0.035, item.depth * 0.92], [0, item.height * 0.4, 0], item.color)}</>
      case 'roof':
        return <>{box([item.width, 0.16, item.depth * 0.55], [0, item.height * 0.72, -item.depth * 0.23])}{box([item.width, 0.16, item.depth * 0.55], [0, item.height * 0.72, item.depth * 0.23])}</>
      case 'garage':
        return <>{box([item.width, item.height, item.depth], [0, item.height / 2, 0], item.color)}{box([item.width * 0.76, item.height * 0.65, 0.08], [0, item.height * 0.36, item.depth / 2 + 0.045], '#8f9999')}</>
      case 'car':
        return <>{box([item.width, item.height * 0.42, item.depth], [0, -item.height * 0.08, 0], item.color)}{box([item.width * 0.72, item.height * 0.42, item.depth * 0.48], [0, item.height * 0.31, -item.depth * 0.05], '#9fb9bd')}{[-1, 1].flatMap((side) => [-1, 1].map((axle) => <mesh key={`wheel-${side}-${axle}`} position={[side * item.width * 0.49, -item.height * 0.25, axle * item.depth * 0.32]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.26, 0.26, 0.16, 12]} /><meshStandardMaterial color="#303332" /></mesh>))}</>
      case 'kitchen':
        return <>{box([item.width, item.height * 0.74, item.depth], [0, item.height * 0.37, 0])}{box([item.width, 0.08, item.depth * 1.12], [0, item.height * 0.8, 0], '#777b79')}{box([0.03, item.height * 0.56, 0.025], [0, item.height * 0.34, item.depth / 2 + 0.015], '#969996')}</>
      case 'bath':
        return <>{box([item.width, item.height * 0.48, item.depth], [0, item.height * 0.24, 0], '#edf1ee')}{box([item.width * 0.84, 0.08, item.depth * 0.78], [0, item.height * 0.5, 0], item.color)}</>
      case 'fence':
        return <>{box([item.width, item.height * 0.13, item.depth], [0, item.height * 0.9, 0])}{Array.from({ length: Math.max(3, Math.floor(item.width / 0.4)) }, (_, index) => box([0.1, item.height, item.depth], [-item.width / 2 + (index + 0.5) * item.width / Math.max(3, Math.floor(item.width / 0.4)), item.height / 2, 0]))}</>
      case 'balcony':
        return <>{box([item.width, 0.1, item.depth], [0, -item.height * 0.35, 0])}{box([item.width, item.height * 0.7, 0.07], [0, 0, item.depth * 0.47], '#a4aaa8')}{box([0.07, item.height * 0.7, item.depth], [-item.width * 0.47, 0, 0], '#a4aaa8')}</>
      default:
        return box([item.width, item.height, item.depth], [0, 0, 0])
    }
  }

  return (
    <group
      position={item.position}
      rotation={[0, item.rotation, 0]}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerOver={(event) => {
        event.stopPropagation()
        hoveringRef.current = true
        setHoveredName(item.name)
        if (!draggingRef.current) {
          setOrbitEnabled(false)
          updateCursor('grab')
        }
      }}
      onPointerOut={(event) => {
        event.stopPropagation()
        hoveringRef.current = false
        setHoveredName(null)
        if (!draggingRef.current) {
          setOrbitEnabled(true)
          updateCursor('')
        }
      }}
      onDoubleClick={(event) => { event.stopPropagation(); setSelected(item.id) }}
    >
      {item.type === 'wall' ? box([item.width, item.height, item.depth], [0, 0, 0]) :
        item.type === 'floor' || item.type === 'path' ? box([item.width, item.height, item.depth], [0, 0, 0]) : furniture()}
      {selected && <mesh position={[0, item.type === 'floor' ? item.height / 2 + 0.02 : 0, 0]}>
        <boxGeometry args={[item.width + 0.08, item.height + 0.08, item.depth + 0.08]} />
        <meshBasicMaterial color="#bd7951" wireframe transparent opacity={0.75} />
      </mesh>}
    </group>
  )
}

function Lighting() {
  const night = useBuilderStore((state) => state.night)
  const { scene } = useThree()
  useFrame(() => { scene.background = new THREE.Color(night ? '#111923' : '#dfe9ed') })
  return <>{night ? <><ambientLight intensity={0.38} color="#a8bfd8" /><directionalLight position={[-5, 10, 4]} intensity={0.45} color="#8ba6c7" /></> : <><ambientLight intensity={0.9} /><directionalLight position={[-7, 12, 7]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} /></>}</>
}

function CameraMode() {
  const view = useBuilderStore((state) => state.view)
  const activeFloor = useBuilderStore((state) => state.activeFloor)
  const floorCount = useBuilderStore((state) => state.floorCount)
  const sceneRevision = useBuilderStore((state) => state.sceneRevision)
  const { camera } = useThree()
  useEffect(() => {
    const items = useBuilderStore.getState().items
    const maxX = Math.max(6, ...items.map((item) => Math.abs(item.position[0]) + Math.max(item.width, item.depth) / 2))
    const maxZ = Math.max(6, ...items.map((item) => Math.abs(item.position[2]) + Math.max(item.width, item.depth) / 2))
    const topY = Math.max(...items.map((item) => item.position[1] + item.height / 2))
    const focusY = activeFloor === 'all'
      ? (floorCount - 1) * 1.6 + 1.4
      : (activeFloor - 1) * 3.2 + 1.4
    const extent = Math.max(maxX, maxZ, topY / 2, 7)
    const distance = extent * 2.9
    const direction = new THREE.Vector3(1, 0.9, 1).normalize()
    if (view === '2d') {
      camera.position.set(0, Math.max(22, distance), 0.001)
      camera.up.set(0, 0, -1)
    } else {
      camera.position.set(
        direction.x * distance,
        focusY + direction.y * distance,
        direction.z * distance,
      )
      camera.up.set(0, 1, 0)
    }
    camera.lookAt(0, view === '2d' ? 0 : focusY, 0)
    camera.updateProjectionMatrix()
  }, [camera, view, activeFloor, floorCount, sceneRevision])
  return null
}

export default function SceneCanvas() {
  const items = useBuilderStore((state) => state.items)
  const view = useBuilderStore((state) => state.view)
  const night = useBuilderStore((state) => state.night)
  const floorCount = useBuilderStore((state) => state.floorCount)
  const activeFloor = useBuilderStore((state) => state.activeFloor)
  const visibleItems = useMemo(() => floorCount === 1 || activeFloor === 'all'
    ? items
    : items.filter((item) => item.position[1] <= activeFloor * 3.2), [items, floorCount, activeFloor])
  const focusY = activeFloor === 'all' ? (floorCount - 1) * 1.6 + 1.4 : (activeFloor - 1) * 3.2 + 1.4
  return (
    <Canvas shadows dpr={[1, 1.6]} camera={{ position: [11, 10, 12], fov: 40 }} gl={{ antialias: true }}>
      <CameraMode />
      <Lighting />
      <Surface />
      {visibleItems.map((item) => <ItemMesh key={item.id} item={item} />)}
      <OrbitControls makeDefault target={[0, focusY, 0]} enableRotate={view === '3d'} enablePan enableZoom minPolarAngle={0.12} maxPolarAngle={Math.PI * 0.49} minDistance={5} maxDistance={90} />
      {night && <fog attach="fog" args={['#111923', 18, 50]} />}
    </Canvas>
  )
}
