export default function ServiceDeliveryPolicyPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Service Delivery Policy</h1>
        <div className="text-base sm:text-lg text-gray-700 leading-relaxed space-y-6">
          <ol className="list-decimal ml-6 mb-4">
            <li><strong>Delivery Method:</strong> All courses and services are delivered online via video conferencing platforms (e.g., Zoom, Microsoft Teams) or through our secure learning portal.</li>
            <li><strong>Access to Services:</strong> Upon successful payment, customers will receive an email confirmation containing booking links or access credentials within 24 hours. Pre-recorded courses will be available immediately via our learning portal. Live sessions must be scheduled in advance using the booking system provided.</li>
            <li><strong>Delivery Timeframe:</strong> Single-session bookings are delivered on the confirmed date and time. Package bookings are delivered according to the agreed schedule (e.g., 10 sessions within 3 months).</li>
            <li><strong>Customer Responsibilities:</strong> Ensure stable internet connectivity and access to the necessary hardware/software for online learning. Attend classes at the scheduled time. Missed sessions may not be rescheduled unless agreed in advance.</li>
            <li><strong>Non-Delivery Situations:</strong> If a service cannot be delivered due to technical issues or instructor unavailability, an alternative date will be offered, or a refund will be processed in accordance with our Refund Policy.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
