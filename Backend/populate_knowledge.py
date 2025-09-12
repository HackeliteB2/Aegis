#!/usr/bin/env python3
"""
Manually populate ChromaDB with Aegis knowledge base
"""

import chromadb
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document

def populate_knowledge():
    print("=== Populating Aegis Knowledge Base ===")
    
    # Initialize embeddings
    print("1. Initializing embeddings...")
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={'device': 'cpu'},
        encode_kwargs={'normalize_embeddings': True}
    )
    
    # Initialize ChromaDB client
    print("2. Connecting to ChromaDB...")
    chroma_client = chromadb.PersistentClient(path="./aegis_chroma_db")
    
    # Initialize vector store
    print("3. Setting up vector store...")
    vector_store = Chroma(
        client=chroma_client,
        collection_name="aegis_knowledge",
        embedding_function=embeddings,
        persist_directory="./aegis_chroma_db"
    )
    
    # Create text splitter
    print("4. Setting up text splitter...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
    
    # Create sample knowledge documents
    print("5. Creating knowledge documents...")
    knowledge_data = [
        {
            "title": "What is Aegis",
            "content": """
            Aegis is a comprehensive tournament management platform for esports and gaming competitions.
            
            CORE FEATURES:
            - Tournament creation and management with multiple formats (Single/Double Elimination, Round Robin, Swiss System, Group Stage + Playoffs)
            - Team registration and roster management with captain roles
            - Match scheduling and automated bracket generation
            - Real-time score tracking and live updates via WebSocket
            - Provably fair draws using Polygon blockchain technology (Chain ID: 137)
            - AI-powered match summaries using Gemini 2.0 Flash
            - Automated email notifications via SendGrid
            - Comprehensive role-based access control system
            - Interactive API documentation and testing interface
            
            TECHNICAL ARCHITECTURE:
            - Backend: FastAPI with Python for high-performance API handling
            - Database: PostgreSQL 17.5 with 9 optimized tables and relationships
            - Blockchain: Polygon Mainnet for transparent and fair tournament draws
            - AI: Google Gemini 2.0 Flash for intelligent content generation
            - Email: SendGrid for reliable notification delivery
            - Real-time: WebSocket connections for live tournament updates
            - Security: JWT authentication with bcrypt password hashing
            - Documentation: Interactive Swagger UI at /docs and ReDoc at /redoc
            """,
            "category": "platform"
        },
        {
            "title": "Tournament Formats",
            "content": """
            Aegis supports multiple tournament formats:
            
            SINGLE ELIMINATION TOURNAMENT:
            - Direct knockout format with immediate elimination
            - Teams eliminated after one loss - no second chances
            - Fastest completion time and most efficient bracket progression
            - Ideal for large participant numbers and time-constrained events
            
            DOUBLE ELIMINATION TOURNAMENT:
            - Comprehensive bracket system with winners and losers brackets
            - Teams receive second chance after first loss via losers bracket
            - More competitive integrity and fairer elimination process
            - Popular format for major championships and competitive events
            
            ROUND ROBIN TOURNAMENT:
            - Every team plays against every other team in the group
            - Most comprehensive format providing complete performance data
            - Best for small group competitions and skill assessment
            
            SWISS SYSTEM TOURNAMENT:
            - Teams paired based on current performance and win/loss records
            - No elimination until final rounds - all teams continue playing
            - Balances competition fairness with efficient tournament progression
            
            GROUP STAGE + PLAYOFFS FORMAT:
            - Initial round-robin groups for qualification and seeding
            - Top teams from each group advance to knockout playoff phase
            - Common format in professional esports and major tournaments
            """,
            "category": "tournaments"
        },
        {
            "title": "User Roles",
            "content": """
            Aegis implements a comprehensive role-based access control system with four distinct user roles:
            
            SYSTEM ADMINISTRATOR (ADMIN):
            - Complete system access and configuration capabilities
            - User account management and role assignment authority
            - Tournament approval and oversight responsibilities
            - System monitoring, maintenance, and troubleshooting
            
            COMPETITION ORGANIZER:
            - Create, configure, and manage tournaments
            - Set tournament rules, formats, and competition schedules
            - Manage team registrations, approvals, and participant lists
            - Configure prize pools, entry fees, and reward distribution
            
            TEAM CAPTAIN/PLAYER:
            - Register and manage team rosters and member information
            - Join tournaments and competitions based on eligibility
            - Submit match results, scores, and game outcomes
            - View detailed team statistics, performance data, and match history
            
            SPECTATOR:
            - View public tournaments, brackets, and competition information
            - Access match results, live scores, and tournament standings
            - Follow favorite teams, players, and ongoing competitions
            - Read-only access to public tournament data and statistics
            """,
            "category": "access_control"
        }
    ]
    
    # Convert to documents
    documents = []
    for item in knowledge_data:
        doc = Document(
            page_content=item["content"].strip(),
            metadata={
                "title": item["title"],
                "category": item["category"],
                "source": "knowledge_base"
            }
        )
        documents.append(doc)
    
    print(f"6. Processing {len(documents)} documents...")
    
    # Split documents into chunks
    texts = text_splitter.split_documents(documents)
    print(f"7. Split into {len(texts)} text chunks")
    
    # Add to vector store
    print("8. Adding documents to ChromaDB...")
    vector_store.add_documents(texts)
    
    print(f"9. Verifying - collection now has documents...")
    collection = chroma_client.get_collection("aegis_knowledge")
    doc_count = collection.count()
    print(f"   Collection now contains: {doc_count} documents")
    
    # Test search
    print("10. Testing search...")
    results = vector_store.similarity_search("What is Aegis?", k=1)
    if results:
        print(f"    SUCCESS: Search returned {len(results)} results")
        print(f"    Preview: {results[0].page_content[:150]}...")
    else:
        print("    WARNING: Search returned no results")
    
    print("\n=== Knowledge Base Population Complete ===")

if __name__ == "__main__":
    populate_knowledge()