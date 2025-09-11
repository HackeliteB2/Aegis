#!/usr/bin/env python3
"""
Test simple chatbot functionality directly
"""

import chromadb
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

def test_simple_chatbot():
    print("=== Simple Chatbot Test ===")
    
    # Initialize components
    print("1. Initializing components...")
    
    # Embeddings
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={'device': 'cpu'},
        encode_kwargs={'normalize_embeddings': True}
    )
    
    # ChromaDB
    chroma_client = chromadb.PersistentClient(path="./aegis_chroma_db")
    vector_store = Chroma(
        client=chroma_client,
        collection_name="aegis_knowledge",
        embedding_function=embeddings,
        persist_directory="./aegis_chroma_db"
    )
    
    # LLM
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash-exp",
        google_api_key="AIzaSyCzm456rBnOOoMDUknEcIjh5Es6M5QPm7U",
        temperature=0.1,
        max_tokens=1024
    )
    
    print("2. Testing retrieval...")
    question = "What is Aegis?"
    docs = vector_store.similarity_search(question, k=2)
    
    if not docs:
        print("ERROR: No documents retrieved!")
        return
        
    print(f"SUCCESS: Retrieved {len(docs)} documents")
    print(f"First doc preview: {docs[0].page_content[:100]}...")
    
    # Create simple prompt
    print("3. Creating simple chain...")
    prompt = PromptTemplate(
        input_variables=["context", "question"],
        template="""Based on the following context about Aegis Tournament Management Platform, answer the question:

Context:
{context}

Question: {question}

Answer:"""
    )
    
    chain = LLMChain(llm=llm, prompt=prompt)
    
    # Prepare context
    context = "\n\n".join([doc.page_content for doc in docs])
    
    print("4. Running chain...")
    try:
        result = chain.run(context=context, question=question)
        print("SUCCESS: Got response!")
        print(f"Response: {result}")
    except Exception as e:
        print(f"ERROR: Chain failed: {e}")
    
    print("\n=== Simple Chatbot Test Complete ===")

if __name__ == "__main__":
    test_simple_chatbot()