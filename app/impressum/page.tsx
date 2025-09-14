import Link from "next/link";

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="fixed top-4 left-4 z-50">
        <Link
          href="/"
          className="flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg shadow-sm transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Home
        </Link>
      </div>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Impressum
          </h1>

          <div className="space-y-6 text-gray-800">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Company Information
              </h2>
              <div className="space-y-2 leading-relaxed">
                <p className="font-medium">
                  JSE Imaging Solutions UG (haftungsbeschränkt)
                </p>
                <p>Managing Director: Kai Jungclaus</p>
                <p>Kolpingstr. 11</p>
                <p>40764 Langenfeld</p>
                <p>Germany</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Contact
              </h2>
              <div className="space-y-2 leading-relaxed">
                <p>Phone: +49 2173 168 882</p>
                <p>
                  Email:{" "}
                  <a
                    href="mailto:sales@jse.de"
                    className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    sales@jse.de
                  </a>
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Legal Information
              </h2>
              <div className="space-y-2 leading-relaxed">
                <p>HRB 92542 Amtsgericht Düsseldorf</p>
                <p>USt-IdNr. / VAT-Id.: DE341751063</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Editorial Responsibility
              </h2>
              <p className="leading-relaxed">
                Responsible for journalistic-editorial content according to § 55
                Abs. 2 RStV: K. Jungclaus at company address.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            © 2025 JSE Imaging Solutions UG. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
