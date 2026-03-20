import { LinkItem } from '../../types'
import { handleLinkOpen } from '../../utils/linkHandler'

interface LinkCardProps {
  link: LinkItem
}

const typeLabels: Record<LinkItem['type'], string> = {
  video: '📺 视频',
  link: '🔗 网页',
  app_link: '📱 App',
}

const typeColors: Record<LinkItem['type'], string> = {
  video: '#e3f2fd',
  link: '#e8f5e9',
  app_link: '#fff3e0',
}

export default function LinkCard({ link }: LinkCardProps) {
  return (
    <div
      onClick={() => handleLinkOpen(link)}
      style={{
        padding: '16px',
        margin: '8px 0',
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <span
        style={{
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '12px',
          background: typeColors[link.type],
          whiteSpace: 'nowrap',
        }}
      >
        {typeLabels[link.type]}
      </span>
      <span style={{ fontWeight: 500 }}>{link.title}</span>
    </div>
  )
}