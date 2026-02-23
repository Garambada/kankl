
from typing import List
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter, HTMLHeaderTextSplitter

class ContentChunker:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ".", " ", ""]
        )

    def chunk_documents(self, documents: List[Document]) -> List[Document]:
        """
        Split documents into smaller chunks for vector indexing.
        """
        print(f"[Chunker] Splitting {len(documents)} documents...")
        
        # If input is HTML (from Upstage Loader), we could use HTML splitter first
        # For simplicity in this phase, we treat content as text/markdown
        
        chunks = self.text_splitter.split_documents(documents)
        print(f"[Chunker] Generated {len(chunks)} chunks.")
        
        return chunks
