import { NextResponse } from "next/server";
import axios from "axios";
const siteData = `
Our website is an online service marketplace where users can register either as customers or service providers.

Key features:
1. **User Registration & Login**: Anyone can create an account and log in.
2. **Become a Provider**: Users can register as service providers to create and manage their own listings.
3. **Service Listings**:
   - Providers can create listings for any type of service they want.
   - Providers can set their own pricing and time limits.
   - Listings are reviewed and verified by the admin before being published (takes 3–7 days).
4. **Booking**:
   - Customers can browse and book any available service.
   - Bookings are based on provider’s availability and terms.

**Service Categories & Examples**:
- 🛠️ Home Repair & Maintenance: Electrician, Plumber, Carpenter, AC Repair, Appliance Repair, Handyman, Painter, Mason, Roofer, Welder
- 🧹 Cleaning Services: Home Deep Cleaning, Bathroom Cleaning, Sofa/Curtain Cleaning, Carpet Cleaning, Office Cleaning, Water Tank Cleaning, Kitchen Cleaning, Car Wash
- 🌿 Outdoor & Gardening: Gardener, Lawn Mowing, Tree Trimming, Landscape Maintenance, Pest Control
- 🧳 Moving & Transportation: House Shifting, Office Relocation, Furniture Moving, Packers & Movers, Pickup Van/Truck Rental
- 🧑‍🎨 Beauty & Personal Care: Haircut at Home, Salon for Women, Salon for Men, Makeup Artist, Massage Therapy
- 🧼 Laundry & Ironing: Clothes Washing, Dry Cleaning Pickup, Ironing Service
- 🖥️ IT & Electronics: Laptop/PC Repair, Mobile Repair, CCTV Installation, Wi-Fi Setup, Smart Home Device Setup
- 🎓 Tutoring & Education: Home Tutor, Language Tutor, Exam Preparation, Computer Courses
- 🧑‍🍳 Food & Catering: Home Cook, Event Catering, Tiffin Service
- 👶 Child & Elderly Care: Babysitter, Elderly Caregiver, Nanny
- 🧍‍♂️ Event & Occasional: Photographer, Videographer, Event Decorator, DJ & Sound Setup, Party Organizer
- 💼 Professional Services: Accountant, Lawyer, Consultant, Document Writing/Typing, Translator
- 🧾 Other: Custom Service (providers can define)

**Platform Rules**:
- Only verified listings are published.
- Providers manage their own schedule and pricing.
- Customers communicate directly with providers via the platform.
- Admin ensures quality and trust by approving services before they go live.

When answering user questions:
- Always base your answers strictly on the information above.
- If a question is unrelated to the platform, politely say you cannot answer it.
`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-8b-8192", // free + fast
         messages: [
      { role: "system", content: `You are a helpful assistant for our service marketplace. Use the following information to answer all questions:\n${siteData}` },
      ...messages
    ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer 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`,
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Groq API error:", error.response?.data || error.message);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
}
