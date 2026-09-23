#!/usr/bin/env python3
"""
Simple PDF Text Extractor
Extracts text and basic structure from PDF files - NO MODEL DOWNLOADS NEEDED!
"""

import sys
import json
import os
from pathlib import Path

def process_pdf(file_path, page_number=0):
    """
    Extract text from PDF using PyMuPDF (fast, no model downloads!)
    
    Args:
        file_path: Path to the PDF file
        page_number: Page number to process (default: 0, first page)
    
    Returns:
        dict: Contains html, markdown, chunks, and metadata
    """
    try:
        import fitz  # PyMuPDF
        
        print(f"📄 Opening PDF: {file_path}", file=sys.stderr)
        
        # Open PDF
        doc = fitz.open(file_path)
        
        if page_number >= len(doc):
            return {
                "success": False,
                "error": f"Page {page_number} not found (PDF has {len(doc)} pages)"
            }
        
        # Get the page
        page = doc[page_number]
        print(f"📃 Processing page {page_number + 1}/{len(doc)}", file=sys.stderr)
        
        # Extract text blocks with position info
        blocks = page.get_text("dict")["blocks"]
        
        # Build HTML and extract chunks
        html_parts = []
        chunks = []
        
        for block in blocks:
            if block.get("type") == 0:  # Text block
                bbox = block["bbox"]
                text_lines = []
                
                for line in block.get("lines", []):
                    line_text = ""
                    for span in line.get("spans", []):
                        line_text += span.get("text", "")
                    if line_text.strip():
                        text_lines.append(line_text.strip())
                
                if text_lines:
                    content = " ".join(text_lines)
                    
                    # Add to HTML
                    html_parts.append(f'<div data-bbox="[{int(bbox[0])},{int(bbox[1])},{int(bbox[2])},{int(bbox[3])}]" data-label="Text">')
                    html_parts.append(f"<p>{content}</p>")
                    html_parts.append("</div>")
                    
                    # Add to chunks
                    chunks.append({
                        "bbox": [int(bbox[0]), int(bbox[1]), int(bbox[2]), int(bbox[3])],
                        "label": "Text",
                        "content": content
                    })
        
        # Get full text for markdown
        full_text = page.get_text()
        
        html = "\n".join(html_parts)
        markdown = full_text
        
        # Get page dimensions before closing
        page_width = int(page.rect.width)
        page_height = int(page.rect.height)
        total_pages = len(doc)
        
        print(f"✅ Extracted {len(chunks)} text blocks", file=sys.stderr)
        print(f"📝 Total text: {len(full_text)} chars", file=sys.stderr)
        
        doc.close()
        
        return {
            "success": True,
            "html": html,
            "markdown": markdown,
            "chunks": chunks,
            "blocks": chunks,
            "raw": html,
            "image_width": page_width,
            "image_height": page_height,
            "metadata": {
                "page_number": page_number,
                "num_blocks": len(chunks),
                "total_pages": total_pages
            }
        }
        
    except ImportError as e:
        return {
            "success": False,
            "error": f"Chandra OCR not installed: {str(e)}",
            "troubleshooting": [
                "Install chandra-ocr: pip install chandra-ocr",
                "Make sure all dependencies are installed",
                "Check Python environment is properly configured"
            ]
        }
    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
            "troubleshooting": [
                "Ensure the PDF file is valid and readable",
                "Check if file path is correct",
                "Verify sufficient memory is available",
                "Try with a simpler PDF file"
            ]
        }


def main():
    """
    Command-line interface for the Chandra service
    Usage: python chandra_service.py <pdf_path> [page_number]
    """
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python chandra_service.py <pdf_path> [page_number]"
        }))
        sys.exit(1)
    
    file_path = sys.argv[1]
    page_number = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    
    if not os.path.exists(file_path):
        print(json.dumps({
            "success": False,
            "error": f"File not found: {file_path}"
        }))
        sys.exit(1)
    
    # Process the PDF
    result = process_pdf(file_path, page_number)
    
    # Output JSON result
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    sys.exit(0 if result.get("success") else 1)


if __name__ == "__main__":
    main()
