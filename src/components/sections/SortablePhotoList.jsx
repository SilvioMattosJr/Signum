import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { useApp } from '../../context/AppContext.jsx'
import PhotoItem from './PhotoItem.jsx'

export default function SortablePhotoList({ photos, itemType, itemId }) {
  const { reorderPhotos } = useApp()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 6 } }),
  )

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIdx = photos.findIndex(p => p.id === active.id)
    const newIdx = photos.findIndex(p => p.id === over.id)
    reorderPhotos(itemType, itemId, arrayMove(photos, oldIdx, newIdx))
  }

  if (photos.length === 0) return null

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={photos.map(p => p.id)} strategy={rectSortingStrategy}>
        {/* photo-grid-3 class allows CSS to change columns per breakpoint */}
        <div
          className="photo-grid-3"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
          }}
        >
          {photos.map((photo, i) => (
            <PhotoItem
              key={photo.id}
              photo={photo}
              itemType={itemType}
              itemId={itemId}
              index={i}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
