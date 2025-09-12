\# Project Aegis Proposal

\## Hackelite 2.0

\*\*Team Name:\*\* B2

\*\*University:\*\* University Of Moratuwa

\*\*Domain:\*\* Social Impact

!\[Cover Image\](https://i.imgur.com/placeholder-cover.jpg)

\---

\## Problem Identification and Context

The esports industry is growing rapidly and becoming a multi-billion-dollar global market. However, many tournaments—especially at the grassroots and semi-professional levels—still rely on manual and outdated systems. This creates several key problems that affect players, organizers, and fans:

\- \*\*Lack of Transparency:\*\* Tournament draws and brackets are often managed by a single person without oversight, raising concerns about fairness and possible bias.

\- \*\*High Administrative Effort:\*\* Organizers spend a lot of time creating brackets, updating results, and managing communication, which takes focus away from improving the event itself.

\- \*\*Weak Spectator Experience:\*\* Fans often receive slow or limited updates, usually through static images or basic posts, which makes following a tournament less exciting and engaging.

\- \*\*Information Gaps:\*\* After a match, there’s usually no quick summary or highlight, making it hard for fans to catch up on important moments.

These challenges reduce trust in the tournament process and limit the overall quality and growth of esports events.

Project Aegis aims to solve these issues by creating a modern, transparent, and efficient platform for managing esports tournaments—benefiting organizers, players, and spectators alike.

\---

\## Solution Concept and Distinctiveness

\### Seamless Automation

Automating key processes like notifications and match summaries to reduce organizer workload.

\### Verifiable Fairness

Utilizing blockchain technology to generate tamper-proof tournament draws.

\### Enhanced Engagement

Providing a live, dynamic, and shareable viewing experience for all stakeholders.

Project Aegis is a web-based platform designed to facilitate the creation and management of esports tournaments with an emphasis on cryptographic-proof and user experience.

The Minimum Viable Product (MVP) will deliver a complete, end-to-end flow for tournament organizers and participants.

Project Aegis differentiates itself from existing tournament platforms in two key ways:

\- \*\*Provably Fair Draws (Blockchain Integration):\*\* While other platforms claim fairness, Aegis will provide cryptographic proof. By generating the tournament draw via a smart contract on the Polygon blockchain, the process becomes transparent, auditable, and immutable. Any participant can independently verify that the draw was not tampered with. This is our core competitive advantage.

\- \*\*AI-Powered Narrative Generation (NLP Integration):\*\* Leveraging the Google Gemini API, Project Aegis will automatically generate exciting, narrative summaries of completed matches based on simple score inputs. This unique feature enhances the user experience for fans and provides valuable, shareable content that no other platform currently offers in an automated fashion.

\### Development Methodology

We will adopt an Agile, feature-driven methodology to deliver the MVP within a 10-week timeline. The project is broken down into four distinct phases, ensuring iterative progress and the ability to adapt:

\- \*\*Phase 1: Backend Foundation\*\* - Establish the core data models, APIs, and authentication systems.

\- \*\*Phase 2: Frontend Core & Organizer UX\*\* - Build the user-facing interface for registration, tournament creation, and management.

\- \*\*Phase 3: Blockchain Integration & Real-time Features\*\* - Develop and integrate the on-chain draw generator and live bracket updates.

\- \*\*Phase 4: Automation & Polish\*\* - Integrate external APIs (Gemini for summaries, SendGrid/Mailgun for notifications), conduct end-to-end testing to ensure a stable, launch-ready product.

!\[Development Phases Diagram\](https://i.imgur.com/placeholder-phases.jpg)

\---

\## Value Proposition and Market Strategy

\### Value Proposition

Project Aegis offers distinct value to each of its key user segments:

1\. \*\*For Tournament Organizers:\*\*

\- Legitimacy & Trust: Attract more participants by offering verifiably fair tournaments.

\- Efficiency: Automate draw generation, notifications, and content creation, saving significant time.

\- Professionalism: Provide a polished, real-time bracket experience for players and fans.

2\. \*\*For Players & Teams:\*\*

\- Guaranteed Fairness: Compete with confidence, knowing the bracket is tamper-proof and transparent.

\- Clarity: Receive timely, automated notifications about schedules and results.

3\. \*\*For Fans & Spectators:\*\*

\- Real-time Engagement: Follow the action on a live-updating bracket, eliminating the need for page refreshes.

\- Rich Content: Enjoy AI-generated summaries that capture the excitement of each match.

\### Market Strategy

Our initial strategy is focused on validating the MVP and achieving product-market fit within the grassroots and semi-pro esports communities.

\- \*\*Internal Validation:\*\* Execute the "Launch Readiness" objective by running at least 5 pilot tournaments internally to ensure end-to-end stability.

\- \*\*Targeted Beta Launch:\*\* Partner with a select group of community tournament organizers (e.g., for games like Valorant, League of Legends, Counter-Strike) to use the platform for free. This will provide invaluable feedback and initial case studies.

\- \*\*Community-Led Growth:\*\* Leverage the platform's unique "shareable bracket URL" feature. As organizers share their tournament links on social media and community forums (like Discord and Reddit), it will organically expose the platform to players and fans.

\- \*\*Feedback-Driven Iteration:\*\* Collect user feedback from the beta phase to prioritize the "Post-MVP" feature backlog (e.g., AI-powered skill ratings, advanced tournament formats), ensuring that V1.1 directly addresses user needs.

The Final Product will be able to support to have Premium Competitions with a closed invitation system, which will need to have a Premium Account for the Competition Organiser and the players.

\---

\## Technical Framework and Development Plan

Project Aegis is built using a modern, scalable, and modular tech stack to ensure performance, reliability, and rapid development.

\- \*\*Frontend:\*\* Built with Next.js, enabling fast and dynamic user interfaces.

\- \*\*Backend:\*\* Powered by FastAPI (Python) for high-speed, asynchronous API handling.

\- \*\*Database:\*\* Uses PostgreSQL, a robust relational database for structured data.

\- \*\*Blockchain Integration:\*\* Runs on Polygon for low-cost, fast transactions. Smart contracts are developed in Solidity, using Hardhat for deployment. Ethers.js handles blockchain interaction on the frontend.

\- \*\*External APIs:\*\* Google Gemini API for AI-generated match summaries. SendGrid/Mailgun for automated email notifications.

\- \*\*Deployment:\*\* Frontend on Netlify, backend and database on Azure.

This stack ensures a secure, transparent, and seamless tournament experience across all user segments.

### System Architecture

The system follows a multi-layered architecture with clear separation of concerns:

**Frontend Layer (Next.js)**
- User interface supporting multiple user roles:
  - System Administrator
  - Competition Organizer  
  - Team Captain/Team Player
  - Spectator
- Future development platform for additional features

**Backend Services (Python Fast API)**
- Auth Service: User authentication and authorization
- WebSocket Server: Real-time communication for live updates
- Event Listener: Processes blockchain events and system notifications
- User/Team API: Manages user profiles and team information
- System Config Service: Handles system-wide configuration

**External Integrations**
- Google Gemini API: AI-powered match summary generation
- SendGrid API: Automated email notifications

**Blockchain Layer**
- Polygon network integration for tamper-proof draw generation
- Smart contracts ensuring verifiable fairness

**Database Layer**
- PostgreSQL for structured data storage and management

!\[Architecture Diagram\](https://i.imgur.com/placeholder-architecture.jpg)

\---

\## User Interaction and Application Scenarios

\### Use Case Diagram for Project Aegis MVP

\- \*\*Actors:\*\* System Administrator, Competition Organizer, Team Captain/Player, Spectator.

\- \*\*Use Cases with Actor Interactions:\*\*

**System Administrator:**
- Manages overall system configuration and user accounts
- Registers and manages tournament organizers
- Oversees system-wide settings and user permissions

**Competition Organizer:**  
- Creates and configures tournaments with specific rules and formats
- Registers teams and manages participant applications
- Triggers blockchain-based draw generation for fair bracket creation
- Updates match results as competitions progress
- Receives automated match summaries via Gemini API integration

**Team Captain/Player:**
- Views tournament listings and applies to participate
- Receives real-time notifications about schedules and match updates
- Accesses live bracket information with WebSocket-powered updates
- Views AI-generated match summaries and tournament progress

**Spectator:**
- Accesses public tournament information and live brackets
- Follows real-time match updates without requiring authentication  
- Receives automated email notifications for followed tournaments (via SendGrid)
- Views exciting AI-generated match narratives and highlights

!\[Use Case Diagram\](https://i.imgur.com/placeholder-usecase.jpg)

\### Sequence Diagrams

**Tournament Draw Generation Process:**
1. Organizer initiates draw generation through Frontend
2. Frontend sends POST request to Firebase Frontend service  
3. Firebase Frontend communicates with Firebase Backend
4. Firebase Backend triggers draw generation on Django Backend
5. Django Backend interacts with PostgreSQL DB to get tournament data
6. Blockchain transaction initiated for tamper-proof draw generation
7. Smart contract executes draw algorithm on blockchain
8. Draw results returned through the chain back to Frontend
9. Real-time updates broadcast to all connected users

**Match Result Update and Summary Generation:**
1. Competition Organizer submits match results via Frontend
2. Results validated and stored in PostgreSQL DB via Django Backend
3. Firebase Backend triggers AI summary generation
4. Google Gemini API processes match data and generates narrative summary  
5. Summary stored and broadcast to all spectators in real-time
6. Automated notifications sent via SendGrid to relevant participants
7. Real-time bracket updates pushed via WebSockets to all connected users

\### Figma Wireframes & Mockups

\[Click here to view\](https://www.figma.com/placeholder)

\---

\## Team Details

\- \*\*B.H.A. Randitha Kulasekera \[Team Lead\]\*\*

200135100143

bharkula3@gmail.com

0704060509

\- \*\*A.G. Aditha Buwaneka Wimalasuriya\*\*

200022101667

adithabuwaneka0@gmail.com

0760454341

\- \*\*B.I.P.D. Mendis\*\*

200067701993

dinushimendisxp@gmail.com

0774758167

\- \*\*H.K.A.R.G. Yasanayaka\*\*

200272601715

geminiyasanayake@gmail.com

0769738494

!\[Team Photos\](https://i.imgur.com/placeholder-team.jpg)

\---

This Markdown file serves as a cover and summary for Project Aegis. You can use it as a README.md in your repository or adapt it as needed. If you have actual image URLs or links, replace the placeholders.