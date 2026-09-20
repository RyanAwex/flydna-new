export interface FlightRoute {
  logo: string;
  name: string;
  dep: string;
  depCode: string;
  arr: string;
  arrCode: string;
  dur: string;
  stops: string;
}

export interface FlightInfo {
  Baggage: string;
  Cabin: string;
  CheckIn: string;
}

export interface Flight {
  id: number;
  tag: string;
  tagColor?: string;
  price: number;
  class: string;
  isDetails?: boolean;
  outbound: FlightRoute;
  return: FlightRoute;
  amenities?: string[];
  info?: FlightInfo;
}

export interface FilterItem {
  label: string;
  value: string;
  checked?: boolean;
}

export const flights: Flight[] = [
  {
    id: 1,
    tag: "Cheapest",
    price: 380,
    class: "First class",
    outbound: {
      logo: "/assets/airlines/delta.png",
      name: "Delta Air Lines",
      dep: "08:00 am",
      depCode: "JFK",
      arr: "11:30 am",
      arrCode: "MIA",
      dur: "3h 30m",
      stops: "Direct",
    },
    return: {
      logo: "/assets/airlines/united.png",
      name: "United Airlines",
      dep: "04:00 pm",
      depCode: "MIA",
      arr: "07:30 pm",
      arrCode: "JFK",
      dur: "3h 30m",
      stops: "Direct",
    },
  },
  {
    id: 2,
    tag: "Best Value",
    price: 240,
    class: "First class",
    isDetails: true,
    outbound: {
      logo: "/assets/airlines/jetblue.png",
      name: "JetBlue Airways",
      dep: "09:00 pm",
      depCode: "BOS",
      arr: "11:55 pm",
      arrCode: "FLL",
      dur: "2h 55m",
      stops: "Direct",
    },
    return: {
      logo: "/assets/airlines/jetblue.png",
      name: "JetBlue Airways",
      dep: "06:00 am",
      depCode: "FLL",
      arr: "09:00 am",
      arrCode: "BOS",
      dur: "3h 00m",
      stops: "Direct",
    },
    amenities: ["Extra Legroom", "Free High-Speed Wifi", "Snacks Available", "Power Outlet"],
    info: { Baggage: "Checked Bag Included", Cabin: "First Class", CheckIn: "Mobile Boarding Pass" },
  },
  {
    id: 3,
    tag: "Popular",
    price: 290,
    class: "First class",
    outbound: {
      logo: "/assets/airlines/american.png",
      name: "American Airlines",
      dep: "10:30 am",
      depCode: "ORD",
      arr: "02:00 pm",
      arrCode: "DFW",
      dur: "3h 30m",
      stops: "Direct",
    },
    return: {
      logo: "/assets/airlines/american.png",
      name: "American Airlines",
      dep: "06:00 pm",
      depCode: "DFW",
      arr: "09:30 pm",
      arrCode: "ORD",
      dur: "3h 30m",
      stops: "Direct",
    },
  },
  {
    id: 4,
    tag: "Cheapest",
    price: 190,
    class: "First class",
    outbound: {
      logo: "/assets/airlines/southwest.png",
      name: "Southwest Airlines",
      dep: "07:00 am",
      depCode: "MDW",
      arr: "10:15 am",
      arrCode: "MCO",
      dur: "3h 15m",
      stops: "Direct",
    },
    return: {
      logo: "/assets/airlines/southwest.png",
      name: "Southwest Airlines",
      dep: "03:00 pm",
      depCode: "MCO",
      arr: "06:20 pm",
      arrCode: "MDW",
      dur: "3h 20m",
      stops: "Direct",
    },
  },
  {
    id: 5,
    tag: "Budget",
    price: 120,
    class: "First class",
    outbound: {
      logo: "/assets/airlines/frontier.png",
      name: "Frontier Airlines",
      dep: "06:00 am",
      depCode: "DEN",
      arr: "09:45 am",
      arrCode: "LAS",
      dur: "2h 45m",
      stops: "Direct",
    },
    return: {
      logo: "/assets/airlines/frontier.png",
      name: "Frontier Airlines",
      dep: "08:00 pm",
      depCode: "LAS",
      arr: "11:45 pm",
      arrCode: "DEN",
      dur: "2h 45m",
      stops: "Direct",
    },
  },
];
