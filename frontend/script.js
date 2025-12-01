const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const fileName = document.getElementById('fileName');
const loading = document.getElementById('loading');
const results = document.getElementById('results');

let selectedFile = null;

uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    selectedFile = e.target.files[0];
    if (selectedFile) {
        fileName.textContent = `Selected: ${selectedFile.name}`;
        analyzeBtn.style.display = 'inline-block';
    }
});

analyzeBtn.addEventListener('click', async () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    loading.style.display = 'block';
    results.style.display = 'none';
    
    try {
        // Check if backend is running
        const response = await fetch('http://127.0.0.1:5000/upload', {
            method: 'POST',
            body: formData,
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayResults(data);
        } else {
            alert('Error: ' + (data.error || 'Unknown error occurred'));
        }
    } catch (error) {
        loading.style.display = 'none';
        console.error('Upload error:', error);
        
        // Better error message
        if (error.message.includes('Failed to fetch')) {
            alert('Cannot connect to server!\n\nPlease make sure:\n1. Backend is running (python3 backend/app.py)\n2. Backend is on http://127.0.0.1:5000\n3. Check terminal for errors');
        } else {
            alert('Error uploading document: ' + error.message);
        }
    } finally {
        loading.style.display = 'none';
    }
});

function displayResults(data) {
    const doctorAnalysis = document.getElementById('doctorAnalysis');
    const patientAnalysis = document.getElementById('patientAnalysis');
    const futureMedsInfo = document.getElementById('futureMedsInfo');
    
    // === 1. ANALYSIS FOR DOCTOR ===
    let doctorHTML = '';
    const docData = data.analysis_for_doctor;
    
    if (docData.document_type) {
        doctorHTML += `<p><strong>Document Type:</strong> ${docData.document_type}</p>`;
    }
    if (docData.patient_name) {
        doctorHTML += `<p><strong>Patient:</strong> ${docData.patient_name}</p>`;
    }
    if (docData.date) {
        doctorHTML += `<p><strong>Date:</strong> ${docData.date}</p>`;
    }
    
    // Urgent Flags
    if (docData.urgent_flags && docData.urgent_flags.length > 0) {
        doctorHTML += `<div class="urgent-box">
            <h3>🚨 URGENT FLAGS</h3>
            <ul>`;
        docData.urgent_flags.forEach(flag => {
            doctorHTML += `<li>${flag}</li>`;
        });
        doctorHTML += `</ul></div>`;
    }
    
    // Key Findings
    if (docData.key_findings && docData.key_findings.length > 0) {
        doctorHTML += `<h3>Key Findings:</h3><ul>`;
        docData.key_findings.forEach(finding => {
            doctorHTML += `<li>${finding}</li>`;
        });
        doctorHTML += `</ul>`;
    }
    
    // Medications
    if (docData.medications && docData.medications.length > 0) {
        doctorHTML += `<h3>Medications:</h3><table style="width:100%; border-collapse: collapse;">
            <tr style="background: #f0f0f0;">
                <th style="padding: 8px; border: 1px solid #ddd;">Medicine</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Dosage</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Frequency</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Duration</th>
            </tr>`;
        docData.medications.forEach(med => {
            doctorHTML += `<tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${med.name || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${med.dosage || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${med.frequency || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${med.duration || 'N/A'}</td>
            </tr>`;
        });
        doctorHTML += `</table>`;
    }
    
    // Test Results
    if (docData.test_results && docData.test_results.length > 0) {
        doctorHTML += `<h3>Test Results:</h3><table style="width:100%; border-collapse: collapse;">
            <tr style="background: #f0f0f0;">
                <th style="padding: 8px; border: 1px solid #ddd;">Test</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Result</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Normal Range</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Status</th>
            </tr>`;
        docData.test_results.forEach(test => {
            const statusColor = test.status === 'Normal' ? '#4caf50' : '#f44336';
            doctorHTML += `<tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${test.test_name}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${test.result}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${test.normal_range || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid #ddd; color: ${statusColor}; font-weight: bold;">${test.status}</td>
            </tr>`;
        });
        doctorHTML += `</table>`;
    }
    
    // Technical Summary
    if (docData.technical_summary) {
        doctorHTML += `<h3>Technical Summary:</h3><p>${docData.technical_summary}</p>`;
    }
    
    // Missing Information
    if (docData.missing_information && docData.missing_information.length > 0) {
        doctorHTML += `<div class="warning-box">
            <h3>⚠️ Missing Information to Confirm:</h3><ul>`;
        docData.missing_information.forEach(item => {
            doctorHTML += `<li>${item}</li>`;
        });
        doctorHTML += `</ul></div>`;
    }
    
    doctorAnalysis.innerHTML = doctorHTML;
    
    // === 2. ANALYSIS FOR PATIENT ===
    let patientHTML = '';
    const patData = data.analysis_for_patient;
    
    if (patData.simple_explanation) {
        patientHTML += `<div class="patient-intro">${patData.simple_explanation}</div>`;
    }
    
    if (patData.what_tests_mean && patData.what_tests_mean.length > 0) {
        patientHTML += `<h3>📊 What Your Tests Mean:</h3><ul class="patient-list">`;
        patData.what_tests_mean.forEach(item => {
            patientHTML += `<li>${item}</li>`;
        });
        patientHTML += `</ul>`;
    }
    
    if (patData.why_medicines_prescribed && patData.why_medicines_prescribed.length > 0) {
        patientHTML += `<h3>💊 Why These Medicines Are Prescribed:</h3><ul class="patient-list">`;
        patData.why_medicines_prescribed.forEach(item => {
            patientHTML += `<li>${item}</li>`;
        });
        patientHTML += `</ul>`;
    }
    
    if (patData.general_precautions && patData.general_precautions.length > 0) {
        patientHTML += `<h3>⚠️ General Precautions:</h3><ul class="patient-list">`;
        patData.general_precautions.forEach(item => {
            patientHTML += `<li>${item}</li>`;
        });
        patientHTML += `</ul>`;
    }
    
    if (patData.what_to_do_next && patData.what_to_do_next.length > 0) {
        patientHTML += `<h3>✅ What to Do Next:</h3><ul class="patient-list">`;
        patData.what_to_do_next.forEach(item => {
            patientHTML += `<li>${item}</li>`;
        });
        patientHTML += `</ul>`;
    }
    
    if (patData.important_note) {
        patientHTML += `<div class="important-note">${patData.important_note}</div>`;
    }
    
    if (patData.disclaimer) {
        patientHTML += `<div class="disclaimer">${patData.disclaimer}</div>`;
    }
    
    patientAnalysis.innerHTML = patientHTML;
    
    // === 3. GENERAL INFO AFFECTING FUTURE MEDICATIONS ===
    let futureHTML = '';
    const futureData = data.general_info_affecting_future_medications;
    
    if (futureData.allergies && futureData.allergies.length > 0) {
        futureHTML += `<div class="allergy-alert">
            <h3>⚠️ Allergies:</h3><ul>`;
        futureData.allergies.forEach(allergy => {
            futureHTML += `<li>${allergy}</li>`;
        });
        futureHTML += `</ul></div>`;
    }
    
    if (futureData.chronic_conditions && futureData.chronic_conditions.length > 0) {
        futureHTML += `<h3>Chronic Conditions:</h3><ul>`;
        futureData.chronic_conditions.forEach(condition => {
            futureHTML += `<li>${condition}</li>`;
        });
        futureHTML += `</ul>`;
    }
    
    if (futureData.organ_function_issues && futureData.organ_function_issues.length > 0) {
        futureHTML += `<h3>Organ Function Issues:</h3><ul>`;
        futureData.organ_function_issues.forEach(issue => {
            futureHTML += `<li>${issue}</li>`;
        });
        futureHTML += `</ul>`;
    }
    
    if (futureData.pregnancy_breastfeeding && futureData.pregnancy_breastfeeding !== 'Not mentioned') {
        futureHTML += `<h3>Pregnancy/Breastfeeding:</h3><p>${futureData.pregnancy_breastfeeding}</p>`;
    }
    
    if (futureData.medical_history && futureData.medical_history.length > 0) {
        futureHTML += `<h3>Medical History:</h3><ul>`;
        futureData.medical_history.forEach(history => {
            futureHTML += `<li>${history}</li>`;
        });
        futureHTML += `</ul>`;
    }
    
    if (futureData.current_medications && futureData.current_medications.length > 0) {
        futureHTML += `<h3>Current Medications:</h3><ul>`;
        futureData.current_medications.forEach(med => {
            futureHTML += `<li>${med}</li>`;
        });
        futureHTML += `</ul>`;
    }
    
    if (futureData.contraindications && futureData.contraindications.length > 0) {
        futureHTML += `<h3>Contraindications:</h3><ul>`;
        futureData.contraindications.forEach(contra => {
            futureHTML += `<li>${contra}</li>`;
        });
        futureHTML += `</ul>`;
    }
    
    if (futureData.notes) {
        futureHTML += `<div class="notes-box"><p><strong>Notes:</strong> ${futureData.notes}</p></div>`;
    }
    
    if (!futureHTML) {
        futureHTML = '<p>No specific information affecting future medications was found in this document.</p>';
    }
    
    futureMedsInfo.innerHTML = futureHTML;
    
    results.style.display = 'block';
}
