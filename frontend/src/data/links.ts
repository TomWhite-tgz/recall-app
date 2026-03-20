import { LinkItem } from '../types'

export const links: LinkItem[] = [
  {
    id: '1',
    type: 'video',
    platform: 'bilibili',
    url: 'https://www.bilibili.com/video/BV1xx411c7mD',
    timestamp: 120,
    title: 'Python装饰器详解',
  },
  {
    id: '2',
    type: 'link',
    url: 'https://docs.python.org/3/tutorial/',
    title: 'Python官方教程',
  },
  {
    id: '3',
    type: 'app_link',
    scheme: 'bilibili://video/BV1xx411c7mD',
    fallback_url: 'https://www.bilibili.com/video/BV1xx411c7mD',
    title: '在B站打开',
  },
]