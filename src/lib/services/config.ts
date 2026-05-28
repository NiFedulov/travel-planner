export type ServiceCategory = 'accommodation' | 'car_rental' | 'travel_intel'

export interface ServiceField {
  key: string
  label: string
  placeholder?: string
  type?: 'text' | 'select'
  options?: string[]
}

export interface ServiceConfig {
  id: string
  name: string
  icon: string
  color: string      // Tailwind color name
  bgColor: string    // Tailwind bg class
  category: ServiceCategory
  fields: ServiceField[]
  historyPrompt: string
  extractsInfo: string
  website: string
}

export const SERVICES: ServiceConfig[] = [
  // ─── Accommodation ────────────────────────────────────────────────────────
  {
    id: 'airbnb',
    name: 'Airbnb',
    icon: '🏠',
    color: 'rose',
    bgColor: 'bg-rose-50',
    category: 'accommodation',
    website: 'airbnb.com',
    fields: [
      { key: 'username', label: 'Profile URL or Username', placeholder: 'airbnb.com/users/show/12345' },
    ],
    historyPrompt: 'Paste your Airbnb booking confirmations (emails) or describe your typical preferences — property type, amenities, price range, superhost preference.',
    extractsInfo: 'Property type, must-have amenities, price range, location preference, host quality',
  },
  {
    id: 'booking',
    name: 'Booking.com',
    icon: '🏨',
    color: 'blue',
    bgColor: 'bg-blue-50',
    category: 'accommodation',
    website: 'booking.com',
    fields: [
      { key: 'username', label: 'Account Email', placeholder: 'your@email.com' },
      { key: 'membershipLevel', label: 'Genius Level', type: 'select', options: ['Genius 1', 'Genius 2', 'Genius 3'] },
    ],
    historyPrompt: 'Paste Booking.com confirmation emails or describe your typical stays — hotel type, stars, cancellation policy, breakfast preference.',
    extractsInfo: 'Hotel type, star rating, breakfast & cancellation preferences, price range',
  },
  {
    id: 'hotels_com',
    name: 'Hotels.com',
    icon: '🛎️',
    color: 'amber',
    bgColor: 'bg-amber-50',
    category: 'accommodation',
    website: 'hotels.com',
    fields: [
      { key: 'username', label: 'Account Email', placeholder: 'your@email.com' },
      { key: 'membershipLevel', label: 'Rewards Tier', type: 'select', options: ['Silver', 'Gold', 'Platinum'] },
    ],
    historyPrompt: 'Paste Hotels.com confirmations or describe your preferences.',
    extractsInfo: 'Hotel chains, star ratings, amenity preferences, price range',
  },
  {
    id: 'vrbo',
    name: 'VRBO / HomeAway',
    icon: '🏡',
    color: 'teal',
    bgColor: 'bg-teal-50',
    category: 'accommodation',
    website: 'vrbo.com',
    fields: [
      { key: 'username', label: 'Account Email', placeholder: 'your@email.com' },
    ],
    historyPrompt: 'Paste VRBO booking confirmations — property type, bedrooms, amenities, location.',
    extractsInfo: 'Property type, size preferences, outdoor amenities, location type',
  },
  {
    id: 'marriott',
    name: 'Marriott Bonvoy',
    icon: '⭐',
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    category: 'accommodation',
    website: 'marriott.com',
    fields: [
      { key: 'membershipId', label: 'Bonvoy Member #', placeholder: '123456789' },
      { key: 'membershipLevel', label: 'Elite Status', type: 'select', options: ['Member', 'Silver Elite', 'Gold Elite', 'Platinum Elite', 'Titanium Elite', 'Ambassador Elite'] },
    ],
    historyPrompt: 'Paste Marriott stay confirmations or describe your chain preferences.',
    extractsInfo: 'Preferred brands (Westin, W, Courtyard), room type, elite benefits usage',
  },
  {
    id: 'hilton',
    name: 'Hilton Honors',
    icon: '🌟',
    color: 'sky',
    bgColor: 'bg-sky-50',
    category: 'accommodation',
    website: 'hilton.com',
    fields: [
      { key: 'membershipId', label: 'Honors Member #', placeholder: '123456789' },
      { key: 'membershipLevel', label: 'Status', type: 'select', options: ['Member', 'Silver', 'Gold', 'Diamond'] },
    ],
    historyPrompt: 'Paste Hilton stay confirmations or describe your preferred Hilton brands.',
    extractsInfo: 'Preferred Hilton brands, room type, price range, amenity preferences',
  },

  // ─── Car Rental ────────────────────────────────────────────────────────────
  {
    id: 'hertz',
    name: 'Hertz',
    icon: '🟡',
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    category: 'car_rental',
    website: 'hertz.com',
    fields: [
      { key: 'membershipId', label: '#1 Club Member #', placeholder: 'H1234567890' },
      { key: 'membershipLevel', label: 'Tier', type: 'select', options: ['#1 Club', 'Gold', 'Five Star', "President's Circle"] },
    ],
    historyPrompt: 'Paste Hertz rental confirmations — car category, extras (GPS, insurance), typical rental duration and price.',
    extractsInfo: 'Car category, extras, insurance habits, price range per day',
  },
  {
    id: 'avis',
    name: 'Avis',
    icon: '🔴',
    color: 'red',
    bgColor: 'bg-red-50',
    category: 'car_rental',
    website: 'avis.com',
    fields: [
      { key: 'membershipId', label: 'Avis Preferred #', placeholder: 'A1234567890' },
      { key: 'membershipLevel', label: 'Tier', type: 'select', options: ['Preferred', 'Select', 'Chairman'] },
    ],
    historyPrompt: 'Paste Avis rental confirmations to analyze your preferences.',
    extractsInfo: 'Car category, transmission, extras, price range',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: '🟢',
    color: 'emerald',
    bgColor: 'bg-emerald-50',
    category: 'car_rental',
    website: 'enterprise.com',
    fields: [
      { key: 'membershipId', label: 'Enterprise Plus #', placeholder: 'E1234567890' },
      { key: 'membershipLevel', label: 'Tier', type: 'select', options: ['Plus', 'Silver', 'Gold', 'Platinum'] },
    ],
    historyPrompt: 'Paste Enterprise rental confirmations.',
    extractsInfo: 'Car category, extras, price range',
  },
  {
    id: 'sixt',
    name: 'Sixt',
    icon: '🟠',
    color: 'orange',
    bgColor: 'bg-orange-50',
    category: 'car_rental',
    website: 'sixt.com',
    fields: [
      { key: 'membershipId', label: 'Sixt Card #', placeholder: 'SX1234567890' },
      { key: 'membershipLevel', label: 'Tier', type: 'select', options: ['Classic', 'Gold', 'Platinum', 'Diamond'] },
    ],
    historyPrompt: 'Paste Sixt rental confirmations.',
    extractsInfo: 'Car category, optional extras, typical price range',
  },
  {
    id: 'europcar',
    name: 'Europcar',
    icon: '🌿',
    color: 'lime',
    bgColor: 'bg-lime-50',
    category: 'car_rental',
    website: 'europcar.com',
    fields: [
      { key: 'membershipId', label: 'Privilege Club #', placeholder: 'EC1234567890' },
      { key: 'membershipLevel', label: 'Tier', type: 'select', options: ['Classic', 'Silver', 'Gold', 'Privilege'] },
    ],
    historyPrompt: 'Paste Europcar rental confirmations.',
    extractsInfo: 'Car category, extras, cross-border habits',
  },
  {
    id: 'national',
    name: 'National Car Rental',
    icon: '🚙',
    color: 'green',
    bgColor: 'bg-green-50',
    category: 'car_rental',
    website: 'nationalcar.com',
    fields: [
      { key: 'membershipId', label: 'Emerald Club #', placeholder: 'N1234567890' },
      { key: 'membershipLevel', label: 'Tier', type: 'select', options: ['Emerald Club', 'Executive', 'Executive Elite'] },
    ],
    historyPrompt: 'Paste National rental confirmations.',
    extractsInfo: 'Car category, typical rental duration, price range',
  },

  // ─── Travel Intelligence ────────────────────────────────────────────────────
  {
    id: 'tripadvisor',
    name: 'TripAdvisor',
    icon: '🦉',
    color: 'green',
    bgColor: 'bg-green-50',
    category: 'travel_intel',
    website: 'tripadvisor.com',
    fields: [
      { key: 'username', label: 'Username', placeholder: 'YourTripAdvisorUsername' },
    ],
    historyPrompt: 'Paste or describe places you reviewed, your typical ratings, types of restaurants and attractions you prefer.',
    extractsInfo: 'Cuisine preferences, attraction types, activity style, typical spend',
  },
  {
    id: 'getyourguide',
    name: 'GetYourGuide / Viator',
    icon: '🎭',
    color: 'purple',
    bgColor: 'bg-purple-50',
    category: 'travel_intel',
    website: 'getyourguide.com',
    fields: [
      { key: 'username', label: 'Account Email', placeholder: 'your@email.com' },
    ],
    historyPrompt: 'Paste tour/activity booking confirmations — what tours, experiences, typical price range, group size.',
    extractsInfo: 'Activity types (tours, adventure, cultural), price range, group preferences',
  },
  {
    id: 'tripit',
    name: 'TripIt',
    icon: '✈️',
    color: 'cyan',
    bgColor: 'bg-cyan-50',
    category: 'travel_intel',
    website: 'tripit.com',
    fields: [
      { key: 'username', label: 'Account Email', placeholder: 'your@email.com' },
    ],
    historyPrompt: 'Paste your TripIt trip summaries or export — past destinations, flight patterns, hotel choices, duration.',
    extractsInfo: 'Travel frequency, destination patterns, trip duration preferences, flight habits',
  },
  {
    id: 'google_maps',
    name: 'Google Maps',
    icon: '🗺️',
    color: 'blue',
    bgColor: 'bg-blue-50',
    category: 'travel_intel',
    website: 'maps.google.com',
    fields: [],
    historyPrompt: 'Paste your saved/starred places or describe places you\'ve visited and loved — restaurants, hotels, attractions. Export from Google Takeout → Maps → Saved Places.',
    extractsInfo: 'Preferred destinations, cuisine types, attraction preferences, neighborhood style',
  },
]

export const SERVICE_CATEGORIES: Record<ServiceCategory, { label: string; description: string; icon: string }> = {
  accommodation: {
    label: 'Accommodation',
    description: 'Connect your booking accounts to analyse your accommodation preferences',
    icon: '🏠',
  },
  car_rental: {
    label: 'Car Rental',
    description: 'Connect your car rental memberships to match your vehicle preferences',
    icon: '🚗',
  },
  travel_intel: {
    label: 'Travel Intelligence',
    description: 'Import your travel history to build a complete travel profile',
    icon: '🧭',
  },
}

export function getService(id: string): ServiceConfig | undefined {
  return SERVICES.find(s => s.id === id)
}

export function getServicesByCategory(category: ServiceCategory): ServiceConfig[] {
  return SERVICES.filter(s => s.category === category)
}
