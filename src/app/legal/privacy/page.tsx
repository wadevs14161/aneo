export default function PrivacyPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Privacy Policy (GDPR-compliant)</h1>
        <div className="text-base sm:text-lg text-gray-700 leading-relaxed space-y-6">
          <p>AneoHub is committed to protecting your privacy and complying with GDPR and other applicable data protection laws.</p>
          <ul className="list-disc ml-6 mb-4">
            <li>Customer data is encrypted and stored securely.</li>
            <li>Access to personal data is restricted to authorised personnel only.</li>
            <li>We do not share or sell your personal information to third parties except as required by law or for service delivery.</li>
            <li>All payment processing is PCI DSS compliant and uses SSL encryption.</li>
            <li>Users may request data deletion or correction at any time by contacting support.</li>
          </ul>
          <p>For more details, please contact our support team.</p>
        </div>
      </div>
    </div>
  );
}
