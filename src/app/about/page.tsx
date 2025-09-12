export default function AboutPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">About AneoHub</h1>
        <div className="text-base sm:text-lg text-gray-700 leading-relaxed space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Business Overview</h2>
            <p>
              <strong>AneoHub</strong> is a comprehensive online marketplace operated by <strong>AneoTrade Ltd</strong> (Company No. 16221118, VAT No. 4850898704, Registered Address: 52A Westerham Road, Sevenoaks, TN13 2PZ, United Kingdom).
              We offer a wide variety of legitimate and compliant online courses and services to a global audience aged 15–65, including academic, professional, creative, lifestyle, and wellness learning opportunities.
              Our platform hosts any course or service that complies with applicable laws, payment provider guidelines, and industry standards.
            </p>
            <ul className="list-disc ml-6 mb-4">
              <li>Academic and test preparation</li>
              <li>Professional skills and career development</li>
              <li>Creative arts, music, and performance</li>
              <li>Health, wellness, and fitness programs</li>
              <li>Cooking and culinary arts</li>
              <li>IT, programming, and digital skills</li>
              <li>Finance and investment education</li>
              <li>Lifestyle hobbies and personal enrichment</li>
              <li>Science, engineering, and technology topics</li>
              <li>Children’s and youth education programs</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Target Audience</h2>
            <ul className="list-disc ml-6 mb-4">
              <li>Primary Age Range: 15–65</li>
              <li>Students seeking academic guidance or skill enhancement</li>
              <li>Working professionals aiming to upgrade career skills or learn new hobbies</li>
              <li>Parents purchasing courses for their children’s education</li>
              <li>Hobbyists and lifelong learners interested in personal enrichment</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Service Delivery Model</h2>
            <ul className="list-disc ml-6 mb-4">
              <li>Fully online platform</li>
              <li>Course formats: One-on-one coaching, small group classes, workshops, tutorial packages</li>
              <li>Secure payment processing via major gateways</li>
              <li>Live delivery via Zoom / Microsoft Teams</li>
              <li>Pre-recorded content hosted on secure cloud storage</li>
              <li>Integrated scheduling system for bookings</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Contact & Support</h2>
            <ul className="list-disc ml-6 mb-4">
              <li>Email, WeChat, Line, WhatsApp, Website Live Chat</li>
              <li>Support Hours: 9 AM – 6 PM UK Time (Monday–Friday)</li>
              <li>Languages: English, Mandarin</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}