# Medical Document Analyzer

## How It Works

### Processing Pipeline:
1. 📤 **Upload** - User uploads medical document (PDF or Image)
2. 📝 **Text Extraction** - OCR (Tesseract) extracts text from images, PyPDF2 from PDFs
3. 🤖 **AI Analysis** - Google Gemini AI analyzes the extracted text
4. 📊 **Generate Summaries** - AI creates two versions:
   - **Doctor's Summary**: Technical medical details, medications, diagnoses
   - **Patient's Summary**: Simple, easy-to-understand explanation
5. 💡 **Display Results** - Both summaries shown side-by-side

## Setup Instructions

### 1. Get Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your API key

### 2. Backend Setup
1. Install Python dependencies:
   ```bash
   pip3 install -r requirements.txt
   ```

2. Install Tesseract OCR (for image processing):
   - macOS: `brew install tesseract`
   - Ubuntu: `sudo apt-get install tesseract-ocr`
   - Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki

3. Create `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```

4. Add your Gemini API key to `.env`:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

5. Run the backend:
   ```bash
   python3 backend/app.py
   ```

### 3. Frontend Setup
1. Start frontend server:
   ```bash
   cd frontend
   python3 -m http.server 8000
   ```
2. Open browser to: http://localhost:8000
3. Upload a medical document (PDF or image)
4. Click "Analyze Document" to see AI-powered results

## Quick Start (macOS)
```bash
# Terminal 1 - Backend
pip3 install -r requirements.txt
brew install tesseract
python3 backend/app.py

# Terminal 2 - Frontend
cd frontend
python3 -m http.server 8000

# Browser: http://localhost:8000
```

## Features
- 🤖 **AI-Powered Analysis** using Google Gemini 2.5 Flash
- 📄 **PDF & Image Support** for prescriptions and reports
- 👨‍⚕️ **Doctor's Summary** with technical medical details
- 👤 **Patient-Friendly Explanation** in simple language
- 🔒 **Privacy-First** - documents processed locally then deleted
- 🎯 **Accurate OCR** using Tesseract for handwritten/printed text
- ⚠️ **Allergy Detection** - Identifies and highlights patient allergies
- 📋 **Medical History** - Extracts chronic conditions affecting future medications
- 💊 **Drug Interaction Warnings** - Alerts about potential medication conflicts
- 🚫 **Contraindication Alerts** - Warns about things to avoid

## What Gets Analyzed

### From Your Document:
- Patient name and date
- Medication names, dosages, and frequencies
- Medical conditions/diagnoses
- **Allergies (drug and food)**
- **Chronic conditions (diabetes, hypertension, etc.)**
- Doctor's name and instructions
- Vital signs (if present)
- Test results (if present)
- **Drug interactions**
- **Contraindications**

### Doctor's Summary Includes:
- Document type identification
- Complete medication list with technical details
- Diagnoses and conditions
- **⚠️ Allergies (highlighted)**
- **📋 Chronic conditions (highlighted)**
- **Drug interaction warnings**
- **Contraindications**
- Vital signs and lab results
- Professional medical terminology
- Clinical recommendations

### Patient's Summary Includes:
- What the document means in simple terms
- Each medication explained clearly
- **⚠️ Your allergies in simple language**
- **📋 Your health conditions explained**
- **🚫 Things to avoid (foods, activities, other meds)**
- **📞 When to call your doctor (warning signs)**
- What conditions mean in everyday language
- Step-by-step instructions
- Important warnings and precautions
- What to do next

## Safety Features
- File size limit: 16MB
- Allowed file types validation
- Secure filename handling
- Automatic file cleanup after processing
- Medical content policy compliance
- No data stored permanently
- **Prominent allergy warnings**
- **Drug interaction alerts**
- **Chronic condition tracking**

## Technology Stack
- **Backend**: Python Flask
- **OCR**: Tesseract (images), PyPDF2 (PDFs)
- **AI**: Google Gemini 2.5 Flash
- **Frontend**: HTML, CSS, JavaScript

## Troubleshooting

### Python not found
- macOS/Linux: Use `python3` instead of `python`
- Windows: Use `python` or `py`

### Tesseract not found
- Make sure Tesseract is installed and in your PATH
- macOS: `brew install tesseract`

### Port already in use
- Change the port in `backend/app.py`: `app.run(debug=True, port=5001)`

### Gemini API Errors

**"models/gemini-pro is not found"**
- App uses `models/gemini-2.5-flash`
- Update package: `pip3 install --upgrade google-generativeai`

**"API key not valid"**
- Verify your API key at [Google AI Studio](https://aistudio.google.com/app/apikey)
- Make sure `.env` file has: `GEMINI_API_KEY=your_key_here`
- No spaces or quotes around the API key

**"Quota exceeded"**
- Free tier has rate limits
- Wait a few minutes and try again
- Consider upgrading to paid tier

**Poor text extraction from images**
- Ensure image is clear and well-lit
- Use high-resolution scans
- Avoid blurry or skewed images
