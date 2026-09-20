interface CarData {
  id: string;
  name: string;
  tags: string[];
  features: {
    seats: number;
    transmission: string;
    largeBags: number;
    smallBags: number;
  };
  location: string;
  price: number;
  freeCancellation: boolean;
  image: string;
}

export const carData: CarData[] = [
  {
    id: "c1",
    name: "Kia Picanto",
    tags: ["Top Pick", "15% discount applied"],
    features: {
      seats: 5,
      transmission: "Automatic",
      largeBags: 1,
      smallBags: 1,
    },
    location: "Dubai International Airport",
    price: 35,
    freeCancellation: true,
    image: "/assets/cars/1.png",
  },
  {
    id: "c2",
    name: "Geely Coolray",
    tags: ["Genius"],
    features: {
      seats: 5,
      transmission: "Automatic",
      largeBags: 3,
      smallBags: 0,
    },
    location: "Dubai International Airport",
    price: 37,
    freeCancellation: true,
    image: "/assets/cars/2.png",
  },
  {
    id: "c3",
    name: "Nissan Sunny",
    tags: ["15% discount applied"],
    features: {
      seats: 5,
      transmission: "Automatic",
      largeBags: 1,
      smallBags: 1,
    },
    location: "Dubai International Airport",
    price: 23,
    freeCancellation: true,
    image: "/assets/cars/3.png",
  },
  {
    id: "c4",
    name: "Suzuki Ciaz",
    tags: ["15% discount applied"],
    features: {
      seats: 5,
      transmission: "Automatic",
      largeBags: 1,
      smallBags: 1,
    },
    location: "Dubai International Airport",
    price: 35,
    freeCancellation: true,
    image: "/assets/cars/4.png",
  },
  {
    id: "c5",
    name: "Kia Picanto",
    tags: ["Genius"],
    features: {
      seats: 5,
      transmission: "Automatic",
      largeBags: 1,
      smallBags: 1,
    },
    location: "Dubai International Airport",
    price: 38,
    freeCancellation: true,
    image: "/assets/cars/1.png",
  },
  {
    id: "c6",
    name: "Ford Taurus",
    tags: ["Genius"],
    features: {
      seats: 5,
      transmission: "Automatic",
      largeBags: 1,
      smallBags: 0,
    },
    location: "Dubai International Airport",
    price: 36,
    freeCancellation: true,
    image: "/assets/cars/5.png",
  },
];
