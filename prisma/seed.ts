import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is required for seed')
const adapter = new PrismaPg({ connectionString: url })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Clear existing mock data
  await prisma.mockCar.deleteMany()
  await prisma.mockHotel.deleteMany()
  await prisma.mockFlight.deleteMany()

  // ─── FLIGHTS ─────────────────────────────────────────────────────────────
  await prisma.mockFlight.createMany({
    data: [
      // Cyprus (LCA) → Italy routes
      { fromCode: 'LCA', fromCity: 'Larnaca', fromCountry: 'CY', toCode: 'FCO', toCity: 'Rome', toCountry: 'IT', airline: 'Ryanair', flightNumber: 'FR1204', departureTime: '06:30', arrivalTime: '08:45', durationMin: 135, stops: 0, priceEconomy: 89, priceBusiness: 280, priceFirst: 450, seatsLeft: 38 },
      { fromCode: 'LCA', fromCity: 'Larnaca', fromCountry: 'CY', toCode: 'PSA', toCity: 'Pisa', toCountry: 'IT', airline: 'Ryanair', flightNumber: 'FR4821', departureTime: '07:15', arrivalTime: '09:40', durationMin: 145, stops: 0, priceEconomy: 95, priceBusiness: 295, priceFirst: 480, seatsLeft: 24 },
      { fromCode: 'LCA', fromCity: 'Larnaca', fromCountry: 'CY', toCode: 'MXP', toCity: 'Milan Malpensa', toCountry: 'IT', airline: 'Wizz Air', flightNumber: 'W61830', departureTime: '05:50', arrivalTime: '08:20', durationMin: 150, stops: 0, priceEconomy: 112, priceBusiness: 320, priceFirst: 510, seatsLeft: 15 },
      { fromCode: 'LCA', fromCity: 'Larnaca', fromCountry: 'CY', toCode: 'BGY', toCity: 'Milan Bergamo', toCountry: 'IT', airline: 'Ryanair', flightNumber: 'FR5501', departureTime: '11:20', arrivalTime: '13:50', durationMin: 150, stops: 0, priceEconomy: 78, priceBusiness: 250, priceFirst: 420, seatsLeft: 42 },
      { fromCode: 'LCA', fromCity: 'Larnaca', fromCountry: 'CY', toCode: 'FLR', toCity: 'Florence', toCountry: 'IT', airline: 'easyJet', flightNumber: 'U22341', departureTime: '14:00', arrivalTime: '16:30', durationMin: 150, stops: 0, priceEconomy: 105, priceBusiness: 310, priceFirst: 495, seatsLeft: 8 },
      { fromCode: 'LCA', fromCity: 'Larnaca', fromCountry: 'CY', toCode: 'VRN', toCity: 'Verona', toCountry: 'IT', airline: 'Ryanair', flightNumber: 'FR6712', departureTime: '08:00', arrivalTime: '10:25', durationMin: 145, stops: 0, priceEconomy: 88, priceBusiness: 270, priceFirst: 440, seatsLeft: 31 },
      // With layover via Athens
      { fromCode: 'LCA', fromCity: 'Larnaca', fromCountry: 'CY', toCode: 'FCO', toCity: 'Rome', toCountry: 'IT', airline: 'Aegean', flightNumber: 'A3801', departureTime: '09:00', arrivalTime: '14:30', durationMin: 210, stops: 1, layoverCode: 'ATH', layoverCity: 'Athens', layoverCountry: 'GR', layoverMin: 75, priceEconomy: 145, priceBusiness: 380, priceFirst: 590, seatsLeft: 20 },
      { fromCode: 'LCA', fromCity: 'Larnaca', fromCountry: 'CY', toCode: 'MXP', toCity: 'Milan Malpensa', toCountry: 'IT', airline: 'Aegean', flightNumber: 'A3901', departureTime: '10:15', arrivalTime: '16:00', durationMin: 225, stops: 1, layoverCode: 'ATH', layoverCity: 'Athens', layoverCountry: 'GR', layoverMin: 90, priceEconomy: 138, priceBusiness: 360, priceFirst: 560, seatsLeft: 18 },
      // Stopover option: LCA → IST (overnight) → MXP
      { fromCode: 'LCA', fromCity: 'Larnaca', fromCountry: 'CY', toCode: 'MXP', toCity: 'Milan Malpensa', toCountry: 'IT', airline: 'Turkish Airlines', flightNumber: 'TK787', departureTime: '18:30', arrivalTime: '14:00+1', durationMin: 1410, stops: 1, layoverCode: 'IST', layoverCity: 'Istanbul', layoverCountry: 'TR', layoverMin: 960, transitVisa: false, priceEconomy: 165, priceBusiness: 420, priceFirst: 650, seatsLeft: 30, isStopover: true, stopoverNights: 1 },

      // Return flights Italy → Cyprus
      { fromCode: 'FCO', fromCity: 'Rome', fromCountry: 'IT', toCode: 'LCA', toCity: 'Larnaca', toCountry: 'CY', airline: 'Ryanair', flightNumber: 'FR1205', departureTime: '10:00', arrivalTime: '14:15', durationMin: 135, stops: 0, priceEconomy: 92, priceBusiness: 285, priceFirst: 460, seatsLeft: 22 },
      { fromCode: 'MXP', fromCity: 'Milan Malpensa', fromCountry: 'IT', toCode: 'LCA', toCity: 'Larnaca', toCountry: 'CY', airline: 'Wizz Air', flightNumber: 'W61831', departureTime: '15:45', arrivalTime: '20:10', durationMin: 145, stops: 0, priceEconomy: 108, priceBusiness: 315, priceFirst: 505, seatsLeft: 19 },
      { fromCode: 'BGY', fromCity: 'Milan Bergamo', fromCountry: 'IT', toCode: 'LCA', toCity: 'Larnaca', toCountry: 'CY', airline: 'Ryanair', flightNumber: 'FR5502', departureTime: '19:30', arrivalTime: '23:55', durationMin: 145, stops: 0, priceEconomy: 82, priceBusiness: 255, priceFirst: 425, seatsLeft: 35 },
      { fromCode: 'PSA', fromCity: 'Pisa', fromCountry: 'IT', toCode: 'LCA', toCity: 'Larnaca', toCountry: 'CY', airline: 'Ryanair', flightNumber: 'FR4822', departureTime: '16:20', arrivalTime: '20:45', durationMin: 145, stops: 0, priceEconomy: 98, priceBusiness: 300, priceFirst: 485, seatsLeft: 27 },

      // Internal Italy segments (for multi-city)
      { fromCode: 'PSA', fromCity: 'Pisa', fromCountry: 'IT', toCode: 'MXP', toCity: 'Milan', toCountry: 'IT', airline: 'ITA Airways', flightNumber: 'AZ1220', departureTime: '08:00', arrivalTime: '09:15', durationMin: 75, stops: 0, priceEconomy: 65, priceBusiness: 180, priceFirst: 290, seatsLeft: 40 },
      { fromCode: 'FLR', fromCity: 'Florence', fromCountry: 'IT', toCode: 'MXP', toCity: 'Milan', toCountry: 'IT', airline: 'ITA Airways', flightNumber: 'AZ1320', departureTime: '09:30', arrivalTime: '10:40', durationMin: 70, stops: 0, priceEconomy: 58, priceBusiness: 165, priceFirst: 270, seatsLeft: 33 },

      // Other popular routes for testing
      { fromCode: 'LHR', fromCity: 'London', fromCountry: 'GB', toCode: 'FCO', toCity: 'Rome', toCountry: 'IT', airline: 'British Airways', flightNumber: 'BA0550', departureTime: '10:30', arrivalTime: '14:10', durationMin: 160, stops: 0, priceEconomy: 125, priceBusiness: 450, priceFirst: 980, seatsLeft: 12 },
      { fromCode: 'CDG', fromCity: 'Paris', fromCountry: 'FR', toCode: 'FCO', toCity: 'Rome', toCountry: 'IT', airline: 'Air France', flightNumber: 'AF1050', departureTime: '07:40', arrivalTime: '09:50', durationMin: 130, stops: 0, priceEconomy: 98, priceBusiness: 340, priceFirst: 720, seatsLeft: 25 },
    ],
  })

  // ─── HOTELS ───────────────────────────────────────────────────────────────
  await prisma.mockHotel.createMany({
    data: [
      // Florence
      { city: 'Florence', country: 'IT', name: 'Hotel Davanzati', stars: 3, type: 'hotel', pricePerNight: 128, petFriendly: false, wheelchairAccess: true, breakfastIncl: true, parking: false, pool: false, gym: false, wifi: true, distanceCenter: 0.2, rating: 4.6, reviewCount: 1842, imageSlug: 'florence-hotel-1', address: 'Via Porta Rossa 5, Florence' },
      { city: 'Florence', country: 'IT', name: 'Soprarno Suites', stars: 4, type: 'boutique', pricePerNight: 185, petFriendly: true, wheelchairAccess: false, breakfastIncl: false, parking: false, pool: false, gym: false, wifi: true, distanceCenter: 0.8, rating: 4.8, reviewCount: 624, imageSlug: 'florence-hotel-2', address: 'Via Maggio 35, Florence' },
      { city: 'Florence', country: 'IT', name: 'Hostel Archi Rossi', stars: 1, type: 'hostel', pricePerNight: 28, petFriendly: false, wheelchairAccess: false, breakfastIncl: true, parking: false, pool: false, gym: false, wifi: true, distanceCenter: 0.5, rating: 4.3, reviewCount: 3200, imageSlug: 'florence-hostel-1', address: 'Via Faenza 94r, Florence' },
      { city: 'Florence', country: 'IT', name: 'Hotel Brunelleschi', stars: 5, type: 'hotel', pricePerNight: 320, petFriendly: true, wheelchairAccess: true, breakfastIncl: true, parking: true, pool: false, gym: true, wifi: true, distanceCenter: 0.1, rating: 4.7, reviewCount: 980, imageSlug: 'florence-hotel-3', address: 'Piazza Santa Elisabetta 3, Florence' },
      { city: 'Florence', country: 'IT', name: 'Airbnb Oltrarno Loft', stars: 0, type: 'airbnb', pricePerNight: 95, petFriendly: true, wheelchairAccess: false, breakfastIncl: false, parking: false, pool: false, gym: false, wifi: true, distanceCenter: 1.2, rating: 4.9, reviewCount: 187, imageSlug: 'florence-airbnb-1', address: 'Via dei Serragli, Florence' },

      // Tuscany (Val d'Orcia)
      { city: "Val d'Orcia", country: 'IT', name: 'Agriturismo Poggio Covili', stars: 3, type: 'resort', pricePerNight: 115, petFriendly: true, wheelchairAccess: false, breakfastIncl: true, parking: true, pool: true, gym: false, wifi: true, distanceCenter: 5.0, rating: 4.7, reviewCount: 412, imageSlug: 'tuscany-agri-1', address: 'Loc. Poggio Covili, Castiglione d\'Orcia' },
      { city: "Val d'Orcia", country: 'IT', name: 'La Bandita Townhouse', stars: 4, type: 'boutique', pricePerNight: 195, petFriendly: false, wheelchairAccess: false, breakfastIncl: true, parking: true, pool: true, gym: false, wifi: true, distanceCenter: 0.5, rating: 4.9, reviewCount: 238, imageSlug: 'tuscany-boutique-1', address: 'Via Marconi 11, Pienza' },
      { city: 'Siena', country: 'IT', name: 'Grand Hotel Continental', stars: 5, type: 'hotel', pricePerNight: 285, petFriendly: true, wheelchairAccess: true, breakfastIncl: true, parking: true, pool: false, gym: true, wifi: true, distanceCenter: 0.3, rating: 4.6, reviewCount: 756, imageSlug: 'siena-hotel-1', address: 'Banchi di Sopra 85, Siena' },

      // Lake Como
      { city: 'Bellagio', country: 'IT', name: 'Hotel Florence Bellagio', stars: 4, type: 'hotel', pricePerNight: 178, petFriendly: false, wheelchairAccess: true, breakfastIncl: true, parking: false, pool: false, gym: false, wifi: true, distanceCenter: 0.1, rating: 4.5, reviewCount: 1120, imageSlug: 'como-hotel-1', address: 'Piazza Mazzini 46, Bellagio' },
      { city: 'Varenna', country: 'IT', name: 'Hotel Royal Victoria', stars: 4, type: 'hotel', pricePerNight: 195, petFriendly: true, wheelchairAccess: false, breakfastIncl: true, parking: true, pool: false, gym: false, wifi: true, distanceCenter: 0.2, rating: 4.7, reviewCount: 843, imageSlug: 'como-hotel-2', address: 'Piazza San Giorgio 5, Varenna' },
      { city: 'Como', country: 'IT', name: 'Villa d\'Este', stars: 5, type: 'resort', pricePerNight: 520, petFriendly: true, wheelchairAccess: true, breakfastIncl: true, parking: true, pool: true, gym: true, wifi: true, distanceCenter: 3.0, rating: 4.9, reviewCount: 445, imageSlug: 'como-hotel-3', address: 'Via Regina 40, Cernobbio' },
      { city: 'Como', country: 'IT', name: 'Airbnb Lake View Studio', stars: 0, type: 'airbnb', pricePerNight: 88, petFriendly: false, wheelchairAccess: false, breakfastIncl: false, parking: false, pool: false, gym: false, wifi: true, distanceCenter: 1.5, rating: 4.8, reviewCount: 92, imageSlug: 'como-airbnb-1', address: 'Via Lungolario, Como' },

      // Lugano (Switzerland)
      { city: 'Lugano', country: 'CH', name: 'Hotel Splendide Royal', stars: 5, type: 'hotel', pricePerNight: 380, petFriendly: true, wheelchairAccess: true, breakfastIncl: true, parking: true, pool: true, gym: true, wifi: true, distanceCenter: 0.3, rating: 4.8, reviewCount: 612, imageSlug: 'lugano-hotel-1', address: 'Riva Antonio Caccia 7, Lugano' },
      { city: 'Lugano', country: 'CH', name: 'Hotel International au Lac', stars: 4, type: 'hotel', pricePerNight: 210, petFriendly: false, wheelchairAccess: true, breakfastIncl: true, parking: true, pool: false, gym: false, wifi: true, distanceCenter: 0.5, rating: 4.4, reviewCount: 890, imageSlug: 'lugano-hotel-2', address: 'Via Nassa 68, Lugano' },
      { city: 'Lugano', country: 'CH', name: 'Airbnb Paradiso Lakeside', stars: 0, type: 'airbnb', pricePerNight: 145, petFriendly: true, wheelchairAccess: false, breakfastIncl: false, parking: true, pool: false, gym: false, wifi: true, distanceCenter: 2.0, rating: 4.9, reviewCount: 64, imageSlug: 'lugano-airbnb-1', address: 'Via Campagna, Paradiso' },

      // Lake Maggiore
      { city: 'Stresa', country: 'IT', name: 'Grand Hotel des Iles Borromees', stars: 5, type: 'hotel', pricePerNight: 340, petFriendly: true, wheelchairAccess: true, breakfastIncl: true, parking: true, pool: true, gym: true, wifi: true, distanceCenter: 0.2, rating: 4.7, reviewCount: 523, imageSlug: 'maggiore-hotel-1', address: 'Corso Umberto I 67, Stresa' },
      { city: 'Stresa', country: 'IT', name: 'Hotel Regina Palace', stars: 4, type: 'hotel', pricePerNight: 155, petFriendly: false, wheelchairAccess: true, breakfastIncl: true, parking: true, pool: true, gym: false, wifi: true, distanceCenter: 0.3, rating: 4.4, reviewCount: 1340, imageSlug: 'maggiore-hotel-2', address: 'Corso Umberto I 33, Stresa' },
      { city: 'Verbania', country: 'IT', name: 'Pironi Hotel', stars: 3, type: 'boutique', pricePerNight: 98, petFriendly: false, wheelchairAccess: false, breakfastIncl: true, parking: false, pool: false, gym: false, wifi: true, distanceCenter: 0.1, rating: 4.6, reviewCount: 456, imageSlug: 'maggiore-hotel-3', address: 'Via Vittorio Veneto 6, Cannobio' },

      // Lake Garda
      { city: 'Sirmione', country: 'IT', name: 'Hotel Catullo', stars: 4, type: 'hotel', pricePerNight: 148, petFriendly: false, wheelchairAccess: false, breakfastIncl: true, parking: true, pool: true, gym: false, wifi: true, distanceCenter: 0.3, rating: 4.5, reviewCount: 987, imageSlug: 'garda-hotel-1', address: 'Piazza Flaminia 7, Sirmione' },
      { city: 'Riva del Garda', country: 'IT', name: 'Hotel Du Lac et Du Parc', stars: 4, type: 'resort', pricePerNight: 165, petFriendly: true, wheelchairAccess: true, breakfastIncl: true, parking: true, pool: true, gym: true, wifi: true, distanceCenter: 0.5, rating: 4.6, reviewCount: 1203, imageSlug: 'garda-hotel-2', address: 'Viale Rovereto 44, Riva del Garda' },
      { city: 'Malcesine', country: 'IT', name: 'Hotel Maximilian', stars: 3, type: 'hotel', pricePerNight: 112, petFriendly: false, wheelchairAccess: false, breakfastIncl: true, parking: true, pool: false, gym: false, wifi: true, distanceCenter: 0.2, rating: 4.4, reviewCount: 654, imageSlug: 'garda-hotel-3', address: 'Via Navene Vecchia 4, Malcesine' },

      // Milan
      { city: 'Milan', country: 'IT', name: 'Hotel Manzoni', stars: 4, type: 'hotel', pricePerNight: 142, petFriendly: false, wheelchairAccess: true, breakfastIncl: true, parking: true, pool: false, gym: true, wifi: true, distanceCenter: 0.6, rating: 4.4, reviewCount: 1567, imageSlug: 'milan-hotel-1', address: 'Via Santo Spirito 20, Milan' },
      { city: 'Milan', country: 'IT', name: 'NH Milan Malpensa', stars: 4, type: 'hotel', pricePerNight: 98, petFriendly: false, wheelchairAccess: true, breakfastIncl: true, parking: true, pool: false, gym: true, wifi: true, distanceCenter: 2.0, rating: 4.2, reviewCount: 2890, imageSlug: 'milan-hotel-2', address: 'Via Cardano 1, Ferno (MXP)' },
      { city: 'Istanbul', country: 'TR', name: 'Hotel Momento Golden Horn', stars: 4, type: 'hotel', pricePerNight: 72, petFriendly: false, wheelchairAccess: false, breakfastIncl: true, parking: false, pool: false, gym: false, wifi: true, distanceCenter: 0.5, rating: 4.5, reviewCount: 2100, imageSlug: 'istanbul-hotel-1', address: 'Piri Mehmet Pasa Sk, Eminonu, Istanbul' },
    ],
  })

  // ─── CARS ─────────────────────────────────────────────────────────────────
  await prisma.mockCar.createMany({
    data: [
      // Pisa (pickup after flight)
      { city: 'Pisa', country: 'IT', company: 'Hertz', model: 'Fiat 500', category: 'economy', seats: 4, automatic: false, pricePerDay: 38, crossBorderAllowed: true, crossBorderFee: 12, unlimitedMiles: true, deposit: 250, minAge: 21, airportPickup: true, imageSlug: 'car-fiat500' },
      { city: 'Pisa', country: 'IT', company: 'Europcar', model: 'VW Golf', category: 'compact', seats: 5, automatic: true, pricePerDay: 52, crossBorderAllowed: true, crossBorderFee: 15, unlimitedMiles: true, deposit: 300, minAge: 21, airportPickup: true, imageSlug: 'car-vw-golf' },
      { city: 'Pisa', country: 'IT', company: 'Sixt', model: 'Toyota Corolla', category: 'standard', seats: 5, automatic: true, pricePerDay: 61, crossBorderAllowed: true, crossBorderFee: 15, unlimitedMiles: true, deposit: 350, minAge: 21, airportPickup: true, imageSlug: 'car-toyota-corolla' },
      { city: 'Pisa', country: 'IT', company: 'Avis', model: 'BMW 3 Series', category: 'luxury', seats: 5, automatic: true, pricePerDay: 98, crossBorderAllowed: true, crossBorderFee: 20, unlimitedMiles: false, deposit: 500, minAge: 25, airportPickup: true, imageSlug: 'car-bmw3' },
      { city: 'Pisa', country: 'IT', company: 'Budget', model: 'Ford Focus', category: 'compact', seats: 5, automatic: false, pricePerDay: 44, crossBorderAllowed: true, crossBorderFee: 12, unlimitedMiles: true, deposit: 280, minAge: 21, airportPickup: true, imageSlug: 'car-ford-focus' },

      // Florence
      { city: 'Florence', country: 'IT', company: 'Hertz', model: 'Mini Cooper', category: 'economy', seats: 4, automatic: true, pricePerDay: 55, crossBorderAllowed: true, crossBorderFee: 15, unlimitedMiles: true, deposit: 300, minAge: 21, airportPickup: false, imageSlug: 'car-mini' },
      { city: 'Florence', country: 'IT', company: 'Europcar', model: 'Opel Crossland', category: 'suv', seats: 5, automatic: true, pricePerDay: 68, crossBorderAllowed: true, crossBorderFee: 18, unlimitedMiles: true, deposit: 380, minAge: 23, airportPickup: false, imageSlug: 'car-opel-crossland' },

      // Milan Malpensa (return drop-off)
      { city: 'Milan', country: 'IT', company: 'Hertz', model: 'Fiat 500', category: 'economy', seats: 4, automatic: false, pricePerDay: 40, crossBorderAllowed: true, crossBorderFee: 12, unlimitedMiles: true, deposit: 250, minAge: 21, airportPickup: true, imageSlug: 'car-fiat500' },
      { city: 'Milan', country: 'IT', company: 'Sixt', model: 'Mercedes C-Class', category: 'luxury', seats: 5, automatic: true, pricePerDay: 115, crossBorderAllowed: true, crossBorderFee: 25, unlimitedMiles: false, deposit: 600, minAge: 25, airportPickup: true, imageSlug: 'car-mercedes-c' },
      { city: 'Milan', country: 'IT', company: 'Europcar', model: 'VW Tiguan', category: 'suv', seats: 5, automatic: true, pricePerDay: 78, crossBorderAllowed: true, crossBorderFee: 18, unlimitedMiles: true, deposit: 400, minAge: 23, airportPickup: true, imageSlug: 'car-vw-tiguan' },
      { city: 'Milan', country: 'IT', company: 'Budget', model: 'Renault Zoe (EV)', category: 'economy', seats: 4, automatic: true, pricePerDay: 48, crossBorderAllowed: false, crossBorderFee: 0, unlimitedMiles: true, deposit: 300, minAge: 21, airportPickup: true, imageSlug: 'car-renault-zoe' },

      // Rome
      { city: 'Rome', country: 'IT', company: 'Hertz', model: 'Alfa Romeo Giulia', category: 'standard', seats: 5, automatic: true, pricePerDay: 72, crossBorderAllowed: true, crossBorderFee: 15, unlimitedMiles: true, deposit: 350, minAge: 21, airportPickup: true, imageSlug: 'car-alfa-giulia' },
      { city: 'Rome', country: 'IT', company: 'Avis', model: 'Fiat Tipo', category: 'compact', seats: 5, automatic: false, pricePerDay: 46, crossBorderAllowed: true, crossBorderFee: 12, unlimitedMiles: true, deposit: 280, minAge: 21, airportPickup: true, imageSlug: 'car-fiat-tipo' },
    ],
  })

  console.log('✅ Seed completed: flights, hotels, cars loaded')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
