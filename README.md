# Resume Builder - Dual Mode (LaTeX & PDF)

A full-stack web application that allows users to create and edit resumes using **LaTeX templates** OR by **uploading existing PDF resumes**. AI extracts fillable fields automatically and generates personalized PDF outputs.

## Features

- 🎯 **Dual Input Modes**: 
  - LaTeX Code: Paste LaTeX template and auto-extract variables
  - PDF Upload: Upload existing resume PDF and extract text automatically
- 🤖 **AI-Powered Field Extraction**: Uses Google Gemini 2.0 Flash to detect fillable fields
- ⚡ **Fast PDF Processing**: PyMuPDF for instant text extraction (<1 second)
- 📝 **Dynamic Form Generation**: Creates editable forms from extracted content
- 📄 **PDF Generation**: 
  - LaTeX: Compiles via online LaTeX compilers
  - PDF: Regenerates using Puppeteer with filled content
- 💻 **Modern UI**: Clean React frontend with TypeScript and Tailwind CSS
- 🔧 **Real-time Processing**: Instant feedback and validation

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite 7.0.4 for build tooling
- Tailwind CSS for styling
- Lucide React icons

### Backend
- Node.js (v18+) with Express
- Google Gemini 2.0 Flash Experimental API
- PyMuPDF (pymupdf) for PDF text extraction
- Puppeteer with Chromium for PDF generation
- Multer for file upload handling

### Python Services
- PyMuPDF: Fast PDF parsing and text extraction
- No ML models needed - lightweight and instant!

## Prerequisites

- Node.js (v18+ recommended)
- Google Gemini AI API key
- Git

## Setup Instructions

cd resume-builder-mvp
```

### 2. Backend Setup

```bash
cd backend
npm install
```

**Install Python dependencies:**
```bash
pip install -r requirements.txt
```

**Install Chromium for Puppeteer:**
```bash
npx puppeteer browsers install chrome
```

**Create `.env` file in backend directory:**
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
```

**Start the backend server:**
```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173/`

## Usage

### Mode 1: LaTeX Template
1. **Paste LaTeX Code**: Enter your LaTeX resume template
2. **Parse Template**: AI extracts fillable fields automatically
3. **Fill Form**: Complete the generated form with your information
4. **Generate PDF**: Click "Generate PDF" to create your resume
5. **Download**: PDF downloads automatically

### Mode 2: PDF Upload
1. **Upload PDF**: Click "PDF Resume" tab and upload existing resume
2. **Auto-Extract**: PyMuPDF extracts text instantly (<1 sec)
3. **AI Analysis**: Gemini extracts 30-50 fillable fields automatically
4. **Edit Form**: Modify any field as needed
5. **Generate PDF**: Creates new PDF with updated content
6. **Download**: Get your updated resume

## Project Structure

```
resume-builder-mvp/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── App.tsx          # Main application component
│   │   ├── index.css        # Global styles
│   │   └── main.tsx         # Application entry point
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Node.js backend API
│   ├── server.js            # Express server
│   ├── latex_compiler.py    # LaTeX compilation utilities
│   ├── latex_online.py      # Online LaTeX service integration
│   ├── test-gemini.js       # Gemini API testing
│   └── package.json
├── .gitignore
└── README.md
```

## API Endpoints

- `GET /health` - Backend health check
- `GET /test-gemini` - Test Gemini AI connection
- `POST /upload-tex` - Upload and parse LaTeX template
- `POST /generate-pdf` - Generate PDF from template and data

## Environment Variables

### Backend (.env)
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting

### Common Issues

1. **Backend Offline**: Ensure the backend server is running on port 3001
2. **Gemini API Errors**: Verify your API key is correct and has proper permissions
3. **LaTeX Compilation Errors**: Check that your template syntax is valid
4. **CORS Issues**: Make sure both frontend and backend are running on correct ports

### Support

If you encounter any issues, please check the troubleshooting section or create an issue in the repository.

## Acknowledgments

- Google Gemini AI for intelligent field extraction
- LaTeX community for template standards
- React and Node.js communities for excellent documentation
