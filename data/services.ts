export const serviceCategories = [
  {
    category: "Home Repair & Maintenance",
    icon: "🛠️",
    services: [
      "Electrician",
      "Plumber",
      "Carpenter",
      "AC Repair & Installation",
      "Appliance Repair (Fridge, Washing Machine, Microwave)",
      "Handyman",
      "Painter",
      "Mason (Brick/Tile Work)",
      "Roofer",
      "Welder",
    ],
  },
  {
    category: "Cleaning Services",
    icon: "🧹",
    services: [
      "Home Deep Cleaning",
      "Bathroom Cleaning",
      "Sofa/Curtain Cleaning",
      "Carpet Cleaning",
      "Office Cleaning",
      "Water Tank Cleaning",
      "Kitchen Cleaning",
      "Car Wash at Home",
    ],
  },
  {
    category: "Outdoor & Gardening",
    icon: "🌿",
    services: ["Gardener", "Lawn Mowing", "Tree Trimming", "Landscape Maintenance", "Pest Control"],
  },
  {
    category: "Moving & Transportation",
    icon: "🧳",
    services: [
      "House Shifting",
      "Office Relocation",
      "Furniture Moving",
      "Packers & Movers",
      "Pickup Van/Truck Rental",
    ],
  },
  {
    category: "Beauty & Personal Care",
    icon: "🧑‍🎨",
    services: ["Haircut at Home", "Salon for Women", "Salon for Men", "Makeup Artist", "Massage Therapy"],
  },
  {
    category: "Laundry & Ironing",
    icon: "🧼",
    services: ["Clothes Washing", "Dry Cleaning Pickup", "Ironing Service"],
  },
  {
    category: "IT & Electronics",
    icon: "🖥️",
    services: [
      "Laptop/PC Repair",
      "Mobile Repair",
      "CCTV Installation",
      "Wi-Fi & Networking Setup",
      "Smart Home Device Setup",
    ],
  },
  {
    category: "Tutoring & Education",
    icon: "🎓",
    services: ["Home Tutor (All Grades)", "Language Tutor", "Exam Preparation (SAT, IELTS, etc.)", "Computer Courses"],
  },
  {
    category: "Food & Catering",
    icon: "🧑‍🍳",
    services: ["Home Cook", "Event Catering", "Tiffin Service"],
  },
  {
    category: "Child & Elderly Care",
    icon: "👶",
    services: ["Babysitter", "Elderly Caregiver", "Nanny"],
  },
  {
    category: "Event & Occasional Services",
    icon: "🧍‍♂️",
    services: ["Photographer", "Videographer", "Event Decorator", "DJ & Sound Setup", "Party Organizer"],
  },
  {
    category: "Professional Services",
    icon: "💼",
    services: ["Accountant", "Lawyer", "Consultant", "Document Writing / Typing", "Translator"],
  },
  {
    category: "Other",
    icon: "🧾",
    services: ["Custom Service"], // This will show a text input
  },
]

export const getAllServices = () => {
  return serviceCategories.flatMap((category) =>
    category.services.map((service) => ({
      name: service,
      category: category.category,
    })),
  )
}
