from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import PyPDF2
from PIL import Image
import pytesseract
import google.generativeai as genai
from dotenv import load_dotenv
import json
import re

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
print(f"API Key loaded: {'Yes' if GEMINI_API_KEY else 'No'}")
if GEMINI_API_KEY:
    print(f"API Key (first 10 chars): {GEMINI_API_KEY[:10]}...")
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("ERROR: GEMINI_API_KEY not found in .env file!")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(filepath):
    text = ""
    with open(filepath, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        for page in pdf_reader.pages:
            text += page.extract_text()
    return text

def extract_text_from_image(filepath):
    image = Image.open(filepath)
    text = pytesseract.image_to_string(image)
    return text

def analyze_with_gemini(text):
    """Use Gemini API to analyze medical document"""
    try:
        print("Starting Gemini analysis...")
        print(f"Text length: {len(text)} characters")
        
        # Use available model from the API
        model = genai.GenerativeModel('models/gemini-2.5-flash')
        
        prompt = f"""
You are an AI assistant that analyzes prescriptions and medical reports.

IMPORTANT INSTRUCTIONS:
- Extract all important information factually
- Do NOT diagnose, prescribe, or modify treatments
- Do NOT give medical advice or compare treatments
- Do NOT scare the patient
- If information is unclear or missing, state that instead of guessing
- Always be factual and professional

Medical Document Text:
{text}

Provide your response in this exact JSON format (no markdown):
{{
  "analysis_for_doctor": {{
    "document_type": "Type of document",
    "patient_name": "Patient name if found",
    "date": "Date if found",
    "key_findings": [
      "List abnormal results or important findings"
    ],
    "medications": [
      {{
        "name": "Medicine name",
        "dosage": "Dose",
        "duration": "Duration if available",
        "frequency": "Frequency"
      }}
    ],
    "test_results": [
      {{
        "test_name": "Name of test",
        "result": "Result value",
        "normal_range": "Normal range if available",
        "status": "Normal/Abnormal/High/Low"
      }}
    ],
    "missing_information": [
      "List anything missing that doctor may need to confirm"
    ],
    "technical_summary": "Brief factual summary for healthcare professionals",
    "urgent_flags": [
      "Any critical findings requiring immediate attention"
    ]
  }},
  "analysis_for_patient": {{
    "simple_explanation": "Very simple explanation of what this document is about",
    "what_tests_mean": [
      "Simple explanation of what each test generally measures"
    ],
    "why_medicines_prescribed": [
      "General reasons why these types of medicines are commonly used (not diagnosing)"
    ],
    "general_precautions": [
      "Common precautions patients typically follow with these medicines"
    ],
    "what_to_do_next": [
      "General next steps (always ending with 'follow your doctor's advice')"
    ],
    "important_note": "Reassuring message that instructs to follow doctor's advice"
  }},
  "general_info_affecting_future_medications": {{
    "allergies": [
      "Any drug or food allergies mentioned"
    ],
    "chronic_conditions": [
      "Long-term health conditions (diabetes, hypertension, asthma, etc.)"
    ],
    "organ_function_issues": [
      "Any kidney, liver, heart, or other organ problems mentioned"
    ],
    "pregnancy_breastfeeding": "Status if mentioned, otherwise 'Not mentioned'",
    "medical_history": [
      "Important past medical history that could influence future treatments"
    ],
    "contraindications": [
      "Any mentioned restrictions or things to avoid"
    ],
    "current_medications": [
      "List of current medications (for drug interaction checking)"
    ],
    "notes": "Any other important information affecting future medication choices"
  }}
}}

CRITICAL RULES:
1. For Doctor's Analysis: Be technical, factual, highlight abnormal results. DO NOT suggest treatments.
2. For Patient's Analysis: Be simple, clear, reassuring. DO NOT diagnose or prescribe. DO NOT scare patient.
3. For Future Medications: Extract factual medical history. State if information is unclear or missing.
4. If urgent/dangerous findings: Only state "urgent medical attention required" without treatment advice.
5. Always maintain professional medical documentation standards.
"""
        
        print("Sending request to Gemini...")
        response = model.generate_content(prompt)
        print("Received response from Gemini")
        
        response_text = response.text.strip()
        print(f"Response preview: {response_text[:200]}...")
        
        # Clean up response - remove markdown code blocks
        response_text = re.sub(r'```json\s*', '', response_text)
        response_text = re.sub(r'```\s*$', '', response_text)
        response_text = response_text.strip()
        
        # Parse JSON
        try:
            parsed_response = json.loads(response_text)
            print("Successfully parsed JSON response")
            
            # Add disclaimer to patient analysis
            if 'analysis_for_patient' in parsed_response:
                if 'disclaimer' not in parsed_response['analysis_for_patient']:
                    parsed_response['analysis_for_patient']['disclaimer'] = "This is general informational support only. Always follow your doctor's instructions."
            
            return parsed_response
        except json.JSONDecodeError as e:
            print(f"JSON parsing failed: {e}")
            print(f"Attempted to parse: {response_text[:500]}")
            
            # Create structured fallback
            return {
                "analysis_for_doctor": {
                    "document_type": "Medical Document",
                    "extracted_text": text[:1000],
                    "technical_summary": response_text[:500],
                    "note": "AI provided unstructured response"
                },
                "analysis_for_patient": {
                    "simple_explanation": "Your document has been analyzed. " + response_text[:500],
                    "disclaimer": "This is general informational support only. Always follow your doctor's instructions."
                },
                "general_info_affecting_future_medications": {
                    "notes": "Unable to parse structured information"
                }
            }
        
    except Exception as e:
        print(f"Gemini API Error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Return error details
        return {
            "analysis_for_doctor": {
                "document_type": "Medical Document",
                "extracted_text": text[:500] + "...",
                "error": f"AI analysis failed: {str(e)}",
                "error_type": type(e).__name__
            },
            "analysis_for_patient": {
                "simple_explanation": f"Document uploaded successfully but AI analysis encountered an error: {str(e)}",
                "disclaimer": "This is general informational support only. Always follow your doctor's instructions."
            },
            "general_info_affecting_future_medications": {
                "notes": "Analysis unavailable due to error"
            }
        }

def analyze_medical_document(text):
    """Main analysis function using Gemini"""
    if not GEMINI_API_KEY:
        print("ERROR: No API key configured")
        return {
            "analysis_for_doctor": {
                "document_type": "Medical Document",
                "extracted_text": text,
                "error": "GEMINI_API_KEY not configured in .env file"
            },
            "analysis_for_patient": {
                "simple_explanation": "Document text extracted successfully. Please configure GEMINI_API_KEY in .env file for AI analysis.",
                "disclaimer": "This is general informational support only. Always follow your doctor's instructions."
            },
            "general_info_affecting_future_medications": {
                "notes": "API key required for analysis"
            }
        }
    
    if not text or len(text.strip()) < 10:
        return {
            "analysis_for_doctor": {
                "document_type": "Medical Document",
                "error": "No text could be extracted from the document"
            },
            "analysis_for_patient": {
                "simple_explanation": "Could not extract readable text from your document. Please ensure the image is clear and readable.",
                "disclaimer": "This is general informational support only. Always follow your doctor's instructions."
            },
            "general_info_affecting_future_medications": {
                "notes": "No text extracted"
            }
        }
    
    gemini_analysis = analyze_with_gemini(text)
    return (
        gemini_analysis.get("analysis_for_doctor", {}), 
        gemini_analysis.get("analysis_for_patient", {}),
        gemini_analysis.get("general_info_affecting_future_medications", {})
    )

@app.route('/upload', methods=['POST'])
def upload_document():
    print("\n=== New Upload Request ===")
    
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        print(f"File saved: {filepath}")
        
        try:
            # Extract text based on file type
            if filename.lower().endswith('.pdf'):
                print("Extracting text from PDF...")
                extracted_text = extract_text_from_pdf(filepath)
            else:
                print("Extracting text from image...")
                extracted_text = extract_text_from_image(filepath)
            
            print(f"Extracted text length: {len(extracted_text)} characters")
            print(f"Text preview: {extracted_text[:200]}...")
            
            # Analyze the document with Gemini
            doctor_analysis, patient_analysis, future_meds_info = analyze_medical_document(extracted_text)
            
            return jsonify({
                "success": True,
                "filename": filename,
                "analysis_for_doctor": doctor_analysis,
                "analysis_for_patient": patient_analysis,
                "general_info_affecting_future_medications": future_meds_info
            })
        
        except Exception as e:
            print(f"Error processing document: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Error processing document: {str(e)}"}), 500
        finally:
            # Clean up uploaded file
            if os.path.exists(filepath):
                os.remove(filepath)
                print(f"Cleaned up: {filepath}")
    
    return jsonify({"error": "Invalid file type"}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
