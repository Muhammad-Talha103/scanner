import Link from "next/link"

const sections = [
  {
    emoji: "✅",
    title: "System Requirements",
    content: [
      { label: "Operating System", text: "Windows 10 or later" },
      { label: "Scanner", text: "TWAIN-compliant scanner or any other image capture device" },
      {
        label: "Client Software",
        text: (
          <>
            Encleso Client must be installed. Download from{" "}
            <Link
              href="https://encleso.com"
              className="text-blue-600 underline hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              encleso.com
            </Link>
          </>
        ),
      },
    ],
  },
  {
    emoji: "🚀",
    title: "Getting Started",
    steps: [
      {
        title: "Install Encleso Client",
        text: (
          <>
            Visit{" "}
            <Link
              href="https://encleso.com"
              className="text-blue-600 underline hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              encleso.com
            </Link>{" "}
            and install the Encleso Client on your Windows machine.
          </>
        ),
      },
      {
        title: "Connect Your Scanner",
        text: "Plug in a TWAIN-compliant scanner or supported image capture device; ensure it's powered and connected via USB or network.",
      },
      {
        title: "Open GreweScanner in Your Browser",
        text: "Launch the GreweScanner web app. It should auto-detect your scanner if all requirements are met.",
      },
      {
        title: "Check the Version",
        text: 'Version number (e.g., v1.00) is visible in the header near the "User Icon" button and updates with new releases.',
      },
    ],
  },
  {
    emoji: "🛠️",
    title: "Troubleshooting (if needed)",
    content: [
      {
        label: "Scanner not detected?",
        text: "Ensure scanner is TWAIN-compliant and Encleso Client is running.",
      },
      {
        label: "Still not working?",
        text: "Restart browser and client; check no other app is using scanner.",
      },
      {
        label: "Client won't start?",
        text: "Reinstall from official site, run as Administrator if needed.",
      },
      {
        label: "Reinstall scanner?",
        text: "Remove device via Control Panel → Devices and Printers, then reconnect for automatic driver installation.",
      },
      {
        label: "TWAIN Connection Limitation",
        text: (
          <>
            Please note that TWAIN can only connect to one application or one browser window at a time. If the scanner
            list initialization does not finish, it means another application or another GreweScanner/Encleso browser
            window is already using the scanner. 👉 <strong>Solution:</strong> Close all other scanning applications. If
            multiple GreweScanner or Encleso browser windows are open, keep only the one you want to use. Then, try
            initializing the scanner list again.
          </>
        ),
      },
    ],
  },
  {
    emoji: "📬",
    title: "Contact & Feedback",
    content: (
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
        <div>
          <h3 className="text-xl font-semibold mb-3">Questions or feedback?</h3>
          <p className="text-blue-100 mb-2">
            Visit{" "}
            <Link
              href="https://encleso.com"
              className="text-white underline hover:text-blue-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              encleso.com
            </Link>
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-3">Email Support</h3>
          <p className="text-blue-100">
            <Link href="mailto:sales@jse.de" className="text-white underline hover:text-blue-200">
              sales@jse.de
            </Link>
          </p>
        </div>
      </div>
    ),
    bgBlue: true,
  },
]

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-blue-600 text-white py-8 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">GreweScanner Help Center</h1>
          <p className="text-blue-100 mt-2 text-lg">Everything you need to get started with GreweScanner</p>
        </div>
        <div className="fixed top-4 left-4 z-50">
          <Link
            href="/"
            className="flex items-center gap-2 bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded-lg shadow-sm hover:bg-blue-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {sections.map(({ emoji, title, content, steps, bgBlue }, i) => (
          <section key={i}>
            <div className="flex items-center mb-6">
              <span className="text-2xl mr-3">{emoji}</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-blue-600">{title}</h2>
            </div>

            {steps ? (
              <div className="space-y-6">
                {steps.map(({ title: stepTitle, text }, idx) => (
                  <div key={idx} className="bg-white border-l-4 border-blue-500 p-6 shadow-sm rounded-r-lg">
                    <h3 className="text-xl font-semibold text-blue-800 mb-3">{`${idx + 1}. ${stepTitle}`}</h3>
                    <p className="text-gray-700 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            ) : content instanceof Array ? (
              <div className={`bg-blue-50 rounded-lg p-6 grid gap-4 sm:grid-cols-1 md:grid-cols-${content.length}`}>
                {content.map(({ label, text }, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
                    <h3 className="font-semibold text-blue-800 mb-2">{label}</h3>
                    <p className="text-gray-700">{text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`${bgBlue ? "bg-blue-600 text-white" : "bg-blue-50"} rounded-lg p-6`}>{content}</div>
            )}
          </section>
        ))}
      </main>

      <footer className="bg-gray-50 border-t py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600">© 2025 GreweScanner. Powered by Encleso Client.</p>
        </div>
      </footer>
    </div>
  )
}
