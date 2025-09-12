export default function CustomerAgreementPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Customer Agreement</h1>
        <div className="text-base sm:text-lg text-gray-700 leading-relaxed space-y-6">
          <ol className="list-decimal ml-6 mb-4">
            <li><strong>Services Provided:</strong> Provider agrees to deliver online educational courses and related services as described on our website at the time of purchase.</li>
            <li><strong>Customer Responsibilities:</strong> Customer agrees to provide accurate personal and payment information, attend scheduled classes punctually, and comply with all platform policies.</li>
            <li><strong>Fees and Payments:</strong> Customer shall pay the fees specified at the time of purchase. All payments are due in full before the start of the course unless otherwise agreed.</li>
            <li><strong>Cancellations and Refunds:</strong> Cancellations must be made in accordance with the Refund Policy.</li>
            <li><strong>Use of Materials:</strong> All course materials are for personal use only and may not be shared or redistributed.</li>
            <li><strong>Termination:</strong> Provider reserves the right to suspend or terminate the Customer’s account for violations of this Agreement or the Terms of Service.</li>
            <li><strong>Governing Law:</strong> This Agreement shall be governed by and construed in accordance with the laws of England and Wales.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
