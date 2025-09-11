
import Head from 'next/head';
import Link from 'next/link';

export default function About() {
  const teamMembers = [
    {
      name: "Alex Chen",
      role: "Founder & CEO",
      bio: "Former esports professional with 10+ years in competitive gaming. Passionate about transparency.",
      image: "AC"
    },
    {
      name: "Sarah Rodriguez",
      role: "CTO",
      bio: "Blockchain engineer with expertise in smart contracts and scalable gaming infrastructure.",
      image: "SR"
    },
    {
      name: "Marcus Kim",
      role: "Head of Product",
      bio: "Tournament organizer turned product manager. Knows what the community really needs.",
      image: "MK"
    },
    {
      name: "Emily Zhang",
      role: "AI Engineer",
      bio: "Specialist in NLP and machine learning, bringing intelligent automation to esports.",
      image: "EZ"
    }
  ];

  const milestones = [
    { year: "2024", title: "Project Inception", desc: "Founded with the vision to bring transparency to esports" },
    { year: "Q1 2025", title: "MVP Development", desc: "Built core platform with blockchain integration" },
    { year: "Q2 2025", title: "Beta Launch", desc: "Launching with select tournament organizers" },
    { year: "Q3 2025", title: "Public Release", desc: "Full platform launch with AI-powered features" }
  ];

  return (
    <>
      <Head>
        <title>About Us - Project Aegis</title>
        <meta
          name="description"
          content="Learn about Project Aegis mission to revolutionize esports tournaments with blockchain transparency"
        />
      </Head>

      <div className="min-h-screen bg-gray-900 text-white">

        {/* Hero Section */}
        <div className="container mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6">
              About <span className="text-[#22C55E]">Project Aegis</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We're building the future of esports tournaments with blockchain-verified draws, 
              AI-powered summaries, and unmatched transparency for competitive gaming.
            </p>
          </div>

          {/* Mission Section */}
          <div className="grid md:grid-cols-2 gap-12 mb-20">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-[#22C55E]">Our Mission</h2>
              <p className="text-gray-300 mb-4">
                Esports deserves better. We're eliminating the opacity and mistrust that plagues 
                competitive gaming by leveraging cutting-edge blockchain technology and AI.
              </p>
              <p className="text-gray-300 mb-6">
                Every draw is provably fair, every match is automatically summarized, and every 
                tournament runs with unprecedented transparency. We're not just building software – 
                we're rebuilding trust in competitive gaming.
              </p>
              <div className="space-y-4">
                {[
                  "100% transparent, blockchain-verified tournament draws",
                  "AI-powered match summaries and real-time updates",
                  "Seamless experience for organizers and participants"
                ].map((item, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-[#22C55E] rounded-full flex-shrink-0"></div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
              <h3 className="text-2xl font-bold mb-6 text-[#22C55E]">Why We Started</h3>
              <p className="text-gray-300 mb-4">
                "After years of witnessing match-fixing allegations, biased seeding, and lack of 
                transparency in tournament organization, we knew the esports community deserved better."
              </p>
              <p className="text-gray-300 mb-6">
                "Project Aegis was born from the belief that technology can solve these fundamental 
                trust issues while making tournaments more engaging for everyone involved."
              </p>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#22C55E] rounded-full flex items-center justify-center">
                  <span className="font-bold text-black">AC</span>
                </div>
                <div>
                  <p className="font-semibold text-[#22C55E]">Alex Chen</p>
                  <p className="text-sm text-gray-400">Founder & CEO</p>
                </div>
              </div>
            </div>
          </div>

          {/* Technology Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-12 text-[#22C55E]">Our Technology</h2>
            <div className="grid md:grid-cols-3 gap-8 ">
              {[{
                title: "Blockchain Infrastructure",
                desc: "Built on Polygon for fast, low-cost transactions. Every tournament draw is permanently recorded and verifiable by anyone.",
                icon: (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              }, {
                title: "AI-Powered Automation",
                desc: "Google Gemini API integration automatically generates engaging match summaries and provides intelligent tournament insights.",
                icon: (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              }, {
                title: "Real-Time Updates",
                desc: "Live bracket updates via WebSockets ensure participants and fans never miss a moment of the action.",
                icon: (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )
              }].map(({title, desc, icon}, i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
                  <div className="w-16 h-16 bg-[#22C55E] rounded-full flex items-center justify-center mx-auto mb-4">
                    {icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-[#22C55E]">{title}</h3>
                  <p className="text-gray-300">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-12 text-[#22C55E]">Our Team</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member, i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
                  <div className="w-20 h-20 bg-[#22C55E] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="font-bold text-black text-lg">{member.image}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-[#22C55E]">{member.name}</h3>
                  <p className="text-[#22C55E] font-medium mb-3">{member.role}</p>
                  <p className="text-gray-300 text-sm">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-12 text-[#22C55E]">Our Journey</h2>
            <div className="max-w-4xl mx-auto relative">
              <div className="absolute left-1/2 top-0 -translate-x-1/2 w-1 h-full bg-[#22C55E]"></div>
              {milestones.map((milestone, i) => (
                <div
                  key={i}
                  className={`flex items-center mb-8 relative ${
                    i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  <div className={`w-1/2 ${i % 2 === 0 ? 'pr-8 text-right' : 'pl-8'}`}>
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                      <div className="text-[#22C55E] font-bold text-lg mb-2">{milestone.year}</div>
                      <h3 className="text-xl font-bold mb-2 text-[#22C55E]">{milestone.title}</h3>
                      <p className="text-gray-300">{milestone.desc}</p>
                    </div>
                  </div>
                  <div
                    className="absolute left-1/2 top-6 w-4 h-4 bg-[#22C55E] rounded-full border-4 border-gray-900 -translate-x-1/2"
                    aria-hidden="true"
                  ></div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gray-800 rounded-xl p-12 border border-gray-700">
            <h2 className="text-3xl font-bold mb-6 text-[#22C55E]">Ready to Join the Revolution?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Be part of the next generation of esports tournaments. Experience transparency, 
              fairness, and innovation like never before.
            </p>
            <Link
              href="/"
              className="bg-[#22C55E] hover:bg-[#22C55E] text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-10 w-full py-6 text-center">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} AEGIS Corporation. All rights reserved.
          </p>
        </footer>
      </div>
    </>
  );
}
