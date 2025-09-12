#!/usr/bin/env python3
"""
Test ChromaDB functionality to debug the chatbot issue
"""

import chromadb
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

def test_chromadb():
    print("=== ChromaDB Test ===")
    
    # Initialize embeddings
    print("1. Initializing embeddings...")
    try:
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
        print("SUCCESS: Embeddings initialized successfully")
    except Exception as e:
        print(f"ERROR: Embeddings failed: {e}")
        return

    # Initialize ChromaDB client
    print("2. Connecting to ChromaDB...")
    try:
        chroma_client = chromadb.PersistentClient(path="./aegis_chroma_db")
        print("SUCCESS: ChromaDB client connected")
    except Exception as e:
        print(f"ERROR: ChromaDB connection failed: {e}")
        return

    # Check collections
    print("3. Checking collections...")
    try:
        collections = chroma_client.list_collections()
        print(f"SUCCESS: Found {len(collections)} collections:")
        for col in collections:
            print(f"   - {col.name}: {col.count()} documents")
    except Exception as e:
        print(f"ERROR: Collection check failed: {e}")
        return

    # Test vector store
    print("4. Testing Chroma vector store...")
    try:
        vector_store = Chroma(
            client=chroma_client,
            collection_name="aegis_knowledge",
            embedding_function=embeddings,
            persist_directory="./aegis_chroma_db"
        )
        print("SUCCESS: Vector store created successfully")
    except Exception as e:
        print(f"ERROR: Vector store failed: {e}")
        return

    # Test simple query without parameters
    print("5. Testing basic similarity search...")
    try:
        results = vector_store.similarity_search("tournament", k=2)
        print(f"SUCCESS: Basic search returned {len(results)} results")
        if results:
            print(f"   First result preview: {results[0].page_content[:100]}...")
    except Exception as e:
        print(f"ERROR: Basic search failed: {e}")

    # Test retriever
    print("6. Testing retriever...")
    try:
        retriever = vector_store.as_retriever(search_kwargs={"k": 2})
        results = retriever.invoke("What is Aegis?")
        print(f"SUCCESS: Retriever returned {len(results)} results")
        if results:
            print(f"   First result preview: {results[0].page_content[:100]}...")
    except Exception as e:
        print(f"ERROR: Retriever test failed: {e}")

    print("\n=== ChromaDB Test Complete ===")

if __name__ == "__main__":
    test_chromadb()