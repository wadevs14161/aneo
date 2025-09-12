export default function RefundPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Refund Policy</h1>
        <div className="text-base sm:text-lg text-gray-700 leading-relaxed space-y-6">
          <ul className="list-disc ml-6 mb-4">
            <li>Refund requests are accepted within the policy timeframe stated on the website.</li>
            <li>Refunds are processed within 7–14 working days.</li>
            <li>Dispute resolution is available via customer support and payment platform channels.</li>
            <li>If a service cannot be delivered due to technical issues or instructor unavailability, an alternative date will be offered, or a refund will be processed in accordance with this policy.</li>
          </ul>
          <p>For all refund requests, please contact our support team with your order details.</p>
        </div>
      </div>
    </div>
  );
}
