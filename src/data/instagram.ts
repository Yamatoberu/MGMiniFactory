export type InstagramPhoto = {
  id: string
  shortcode: string
  imageUrl: string
  postUrl: string
  alt: string
}

const INSTAGRAM_POSTS = [
  {
    shortcode: 'DRJMUMFDn06',
    alt: 'Photo by MG Mini Factory on November 16, 2025. May be an image of helmet, hammer, costume, axe and text.',
  },
  {
    shortcode: 'DQ2XOjdkkqr',
    alt: 'Photo by MG Mini Factory on November 09, 2025. May be an image of toy and text.',
  },
  {
    shortcode: 'DQalb8Vjw-C',
    alt: 'Photo by MG Mini Factory on October 29, 2025. May be a cartoon of lego, computer keyboard, skull and text.',
  },
  {
    shortcode: 'DOC7pzzEw_V',
    alt: 'Photo by MG Mini Factory on August 31, 2025.',
  },
  {
    shortcode: 'DKlVbD7RwOC',
    alt: 'Photo by MG Mini Factory on June 06, 2025.',
  },
] as const

export const instagramPhotos: InstagramPhoto[] = INSTAGRAM_POSTS.map((post) => ({
  id: post.shortcode,
  shortcode: post.shortcode,
  imageUrl: `https://www.instagram.com/p/${post.shortcode}/media/?size=l`,
  postUrl: `https://www.instagram.com/p/${post.shortcode}/`,
  alt: post.alt || 'Instagram photo from MG Mini Factory',
}))
