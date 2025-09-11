// pages/privacy.js or app/privacy/page.js
import Head from 'next/head';
import Link from 'next/link';

export default function Privacy() {
  const lastUpdated = "March 15, 2025";

  const sections = [
    {
      title: "Information We Collect",
      content: [
        {
          subtitle: "Account Information",
          text: "When you create an account, we collect your email address, username, and basic profile information necessary for tournament participation."
        },
        {
          subtitle: "Tournament Data",
          text: "We collect information about your tournament participation, match results, team affiliations, and gaming statistics to provide our services."
        },
        {
          subtitle: "Technical Information",
          text: "We automatically collect device information, IP addresses, browser type, and usage patterns to improve our platform and ensure security."
        },
        {
          subtitle: "Blockchain Data",
          text: "Tournament draws and results are recorded on the Polygon blockchain. This data is publicly verifiable but pseudonymous."
        }
      ]
    },
    {
      title: "How We Use Your Information",
      content: [
        {
          subtitle: "Service Provision",
          text: "We use your information to create and manage tournaments, generate fair draws, and provide real-time updates on tournament progress."
        },
        {
          subtitle: "AI-Powered Features",
          text: "Match data is processed through Google Gemini API to generate automated summaries and insights, enhancing the tournament experience."
        },
        {
          subtitle: "Communication",
          text: "We send automated notifications about tournament updates, draw results, and important platform announcements via email."
        },
        {
          subtitle: "Platform Improvement",
          text: "Anonymous usage analytics help us understand user behavior and improve our features and user experience."
        }
      ]
    },
    {
      title: "Data Sharing and Disclosure",
      content: [
        {
          subtitle: "Public Tournament Information",
          text: "Tournament brackets, match results, and team information are publicly visible to enhance transparency and community engagement."
        },
        {
          subtitle: "Service Providers",
          text: "We share limited data with trusted partners including Google (Gemini API), SendGrid (email services), and blockchain infrastructure providers."
        },
        {
          subtitle: "Legal Requirements",
          text: "We may disclose information when required by law, to protect our rights, or to ensure platform security and user safety."
        },
        {
          subtitle: "No Sale of Personal Data",
          text: "We never sell, rent, or trade your personal information to third parties for their marketing purposes."
        }
      ]
    },
    {
      title: "Data Security",
      content: [
        {
          subtitle: "Security Measures",
          text: "We implement industry-standard security measures including encryption, secure access controls, and regular security audits to protect your data."
        },
        {
          subtitle: "Blockchain Security",
          text: "Data recorded on the Polygon blockchain benefits from its inherent cryptographic security, ensuring transparency and immutability."
        },
        {
          subtitle: "User Responsibility",
          text: "You are responsible for maintaining the security of your account credentials and for any activity under your account."
        }
      ]
    }
  ];

  return (
    <>
      <Head>
        <title>Privacy Policy - AEGIS</title>
        <meta name="description" content="Privacy policy for AEGIS security framework" />
      </Head>

      <div className="min-h-screen bg-black text-white px-6 py-12 font-mono">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <h1 className="text-5xl font-bold mb-4 text-center text-[#22C55E]">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mb-12 text-center">
            Last Updated: {lastUpdated}
          </p>

          {/* Sections */}
          {sections.map((section, index) => (
            <div
              key={index}
              className="mb-10 bg-gray-900 border border-[#22C55E]/30 rounded-xl p-8 shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-6 text-center text-[#22C55E]">
                {section.title}
              </h2>
              <div className="space-y-4">
                {section.content.map((item, subIndex) => (
                  <div key={subIndex}>
                    <h3 className="text-lg font-semibold text-[#22C55E]">{item.subtitle}</h3>
                    <p className="text-gray-300">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Back to Home */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-block mt-8 px-6 py-3 bg-[#22C55E] text-black font-bold rounded-md hover:bg-green-500 transition-all duration-300"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
