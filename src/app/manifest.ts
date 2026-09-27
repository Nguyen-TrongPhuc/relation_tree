import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cây Tình Yêu',
    short_name: 'LoveTree',
    description: 'Khu vườn riêng tư của hai người',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffc0cb',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
