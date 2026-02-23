
import os
from typing import List, Dict, Any
from langchain_upstage import UpstageLayoutAnalysisLoader
from langchain_core.documents import Document

class UpstageDocumentLoader:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("UPSTAGE_API_KEY")
        if not self.api_key:
             raise ValueError("UPSTAGE_API_KEY is missing. Please set it in .env or pass it explicitly.")

    def load(self, file_path: str, split: str = "page") -> List[Document]:
        """
        Load a document using Upstage Layout Analysis.
        Args:
            file_path: Path to the PDF or image file.
            split: 'page' to split by pages, 'element' to split by layout elements.
        """
        print(f"[Loader] Processing {file_path} with Upstage Layout Analysis...")
        
        try:
            # Initialize loader with API key
            loader = UpstageLayoutAnalysisLoader(
                file_path, 
                output_type="html", # HTML preserves structure better for the chunker/LLM
                split=split,
                use_ocr=True, # Ensure OCR is used for images/scanned PDFs
                api_key=self.api_key
            )
            
            docs = loader.load()
            print(f"[Loader] Successfully loaded {len(docs)} segments from {file_path}")
            
            # Enhance metadata
            for doc in docs:
                doc.metadata["source"] = file_path
                doc.metadata["loader"] = "UpstageLayoutAnalysis"
                
            return docs
            
        except Exception as e:
            print(f"[Loader] Upstage Layout Analysis failed: {e}")
            print("[Loader] Falling back to PyPDFLoader...")
            
            from langchain_community.document_loaders import PyPDFLoader
            loader = PyPDFLoader(file_path)
            docs = loader.load()
            
            print(f"[Loader] Successfully loaded {len(docs)} pages using PyPDFLoader")
             # Enhance metadata
            for doc in docs:
                doc.metadata["source"] = file_path
                doc.metadata["loader"] = "PyPDFLoader"
            
            return docs

    def load_markdown(self, file_path: str) -> List[Document]:
        """
        Load a markdown file directly for simpler ingestion.
        """
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        return [Document(
            page_content=content,
            metadata={"source": file_path, "type": "markdown"}
        )]
