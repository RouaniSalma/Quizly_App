import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './TeacherModuleDetail.css';

const TeacherModuleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editedQuestions, setEditedQuestions] = useState([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fileUploaded, setFileUploaded] = useState(false);

  // Constantes pour les limites
  const MAX_FILE_SIZE = 1048576; // 1 Mo en octets
  const MAX_FILE_SIZE_MO = (MAX_FILE_SIZE / 1048576).toFixed(2);

  const fetchModuleData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:8000/api/teacher/modules/${id}/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      setModule(response.data);
      setPdfFile(null);
      setFileUploaded(false);
    } catch (error) {
      console.error('Error fetching module data:', error);
      setError('Failed to load module data');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const validateFile = (file) => {
    if (file.type !== 'application/pdf') {
      setErrorMessage('Please upload only PDF files');
      setShowErrorModal(true);
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(`File size exceeds the limit of ${MAX_FILE_SIZE_MO} MB (${(file.size / 1048576).toFixed(2)} MB)`);
      setShowErrorModal(true);
      return false;
    }

    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    if (validateFile(file)) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const file = files[0];
    if (validateFile(file)) {
      handleFile(file);
    }
  };

  const handleFile = (file) => {
    setPdfFile({
      file,
      id: `local-${Date.now()}`,
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      isNew: true
    });
    setIsUploaded(false);
    setFileUploaded(false);
    setError(null);
    setGeneratedQuiz(null);
  };

  const deletePdf = async () => {
    if (!pdfFile) return;
  
    setIsLoading(true);
    try {
      if (!pdfFile.isNew) {
        await axios.delete(`http://localhost:8000/api/teacher/modules/${id}/pdfs/${pdfFile.id}/`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
      }
      
      if (pdfFile.url && pdfFile.isNew) {
        URL.revokeObjectURL(pdfFile.url);
      }
      
      setPdfFile(null);
      setIsUploaded(false);
      setFileUploaded(false);
      setGeneratedQuiz(null);
      setUploadSuccess('PDF deleted successfully');
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFile = async () => {
    if (!pdfFile || !pdfFile.isNew) return;
  
    setIsLoading(true);
    setError(null);
  
    try {
      const formData = new FormData();
      formData.append('file', pdfFile.file);
  
      const response = await axios.post(
        `http://localhost:8000/api/teacher/modules/${id}/upload/`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
  
      const pdfUrl = `http://localhost:8000${response.data.fichier}`;
      setPdfFile({
        id: response.data.id,
        name: response.data.titre,
        url: pdfUrl,
        size: pdfFile.size,
        isNew: false
      });
      
      setIsUploaded(true);
      setFileUploaded(true);
      setUploadSuccess('PDF uploaded successfully!');
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuiz = async () => {
    if (!isUploaded) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `http://localhost:8000/api/teacher/modules/${id}/generate_quiz/`, 
        null,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        }
      );

      setGeneratedQuiz(response.data);
      setEditedQuestions(response.data.questions);
      setShowQuizModal(true);
    } catch (error) {
      console.error("Quiz generation failed:", error);
      setError(error.response?.data?.error || 'Failed to generate quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...editedQuestions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setEditedQuestions(updatedQuestions);
  };

  const handleChoiceChange = (qIndex, cIndex, value) => {
    const updatedQuestions = [...editedQuestions];
    updatedQuestions[qIndex].choices[cIndex].text = value;
    setEditedQuestions(updatedQuestions);
  };

  const handleCorrectAnswerChange = (qIndex, cIndex) => {
    const updatedQuestions = [...editedQuestions];
    updatedQuestions[qIndex].choices.forEach((choice, index) => {
      choice.is_correct = (index === cIndex);
    });
    setEditedQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setEditedQuestions([
      ...editedQuestions,
      {
        text: '',
        choices: [
          { text: '', is_correct: false },
          { text: '', is_correct: false },
          { text: '', is_correct: false },
          { text: '', is_correct: false }
        ]
      }
    ]);
  };

  const removeQuestion = async (index) => {
    const questionToRemove = editedQuestions[index];
    
    try {
      setIsLoading(true);
      
      if (questionToRemove.id) {
        await axios.delete(
          `http://localhost:8000/api/teacher/questions/${questionToRemove.id}/delete/`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
          }
        );
      }
      
      const updatedQuestions = [...editedQuestions];
      updatedQuestions.splice(index, 1);
      setEditedQuestions(updatedQuestions);
      
    } catch (error) {
      console.error('Error deleting question:', error);
      setError(error.response?.data?.error || 'Failed to delete question');
    } finally {
      setIsLoading(false);
    }
  };

  const saveQuiz = async () => {
    if (!generatedQuiz) return;
  
    setIsLoading(true);
    setError(null);
  
    try {
      const quizData = {
        title: generatedQuiz.title,
        description: generatedQuiz.description,
        questions: editedQuestions.map((q, qIndex) => ({
          id: q.id || null,
          text: q.text,
          choices: q.choices.map((c, cIndex) => ({
            id: c.id || null,
            text: c.text,
            is_correct: q.choices.some(choice => choice.is_correct) 
              ? c.is_correct 
              : cIndex === 0
          }))
        }))
      };
  
      const response = await axios.put(
        `http://localhost:8000/api/teacher/quizzes/${generatedQuiz.id}/update/`,
        quizData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      const updatedQuiz = await axios.get(
        `http://localhost:8000/api/teacher/quizzes/${generatedQuiz.id}/`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
  
      setGeneratedQuiz(updatedQuiz.data);
      setEditedQuestions(updatedQuiz.data.questions);
      setShowQuizModal(false);
      setUploadSuccess('Quiz saved successfully!');
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (error) {
      console.error('Error saving quiz:', error);
      setError(error.response?.data?.error || error.message || 'Failed to save quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    fetchModuleData();
    return () => {
      if (pdfFile && pdfFile.url) {
        URL.revokeObjectURL(pdfFile.url);
      }
    };
  }, [fetchModuleData]);

  if (isLoading && !module) return <div className="lo-ading">Loading subject details...</div>;
  if (error) return <div className="er-ror">{error}</div>;
  if (!module) return <div className="er-ror">Subject not found</div>;

  return (
    <div className="module-Detail-container">
      <nav className="Navbar">
        <div className="Navbar-left">
          <span className="Logo">QUIZLY</span>
        </div>
        <div className="Navbar-right">
          <button 
            className="History-btn"
            onClick={() => navigate(`/teacher/modules/${id}/quizzes`)}
          >
            View Quiz History
          </button>
          <button 
            className="Back-button" 
            onClick={() => navigate('/teacher/modules')}
          >
            Back to Subjects
          </button>
          <button className="Logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="module-Content">
        <h1 className="module-Title">{module.name}</h1>

        <div className="pdf-Section">
          <div className="pdf-Upload-section">
            <h2>Upload your PDF file</h2>
            <div className="Upload-info">
              <p><strong>File Requirements :</strong></p>
              <ul>
                <li>Format: PDF only</li>
                <li>Maximum size: {MAX_FILE_SIZE_MO} Mo</li>
                <li>Approximately 3000 words or 8 pages of text</li>
              </ul>
              {showErrorModal && (
                <div className="Error-modal-overlay">
                  <div className="Error-modal">
                    <div className="Modal-header">
                      <h3>Error</h3>
                      <button 
                        className="Close-modal"
                        onClick={() => setShowErrorModal(false)}
                      >
                        &times;
                      </button>
                    </div>
                    <div className="Modal-body">
                      <p>{errorMessage}</p>
                    </div>
                    <div className="Modal-actions">
                      <button 
                        className="Back-button"
                        onClick={() => setShowErrorModal(false)}
                      >
                        Back
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {!pdfFile && (
              <div
                className={`Drop-zone ${isDragOver ? 'Drag-over' : ''} ${error ? 'Error-zone' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <div className="Drop-zone-content">
                  <p>Drag & drop your PDF file here or click to select</p>
                  <p className="Hint">(Only one PDF file at a time)</p>
                </div>
              </div>
            )}

            {uploadSuccess && <div className="Success-message">{uploadSuccess}</div>}

            {pdfFile && (
              <div className="Pdf-actions">
                <div className="File-info">
                  <span className="File-name">{pdfFile.name}</span>
                  <span className="File-size">({(pdfFile.size / 1048576).toFixed(2)} MB)</span>
                </div>
                {pdfFile.isNew && !fileUploaded ? (
                  <>
                    <button
                      className="Upload-btn"
                      onClick={uploadFile}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Uploading...' : 'Upload PDF'}
                    </button>
                    <button 
                      className="Delete-btn" 
                      onClick={deletePdf}
                      disabled={isLoading}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    className="Generate-quiz-btn"
                    onClick={generateQuiz}
                    disabled={isLoading || !isUploaded}
                  >
                    {isLoading ? 'Generating...' : 'Generate Quiz'}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="Pdf-preview-section">
            {pdfFile ? (
              <div className="Pdf-preview-container">
                <div className="Pdf-viewer">
                  <iframe 
                    src={pdfFile.url} 
                    title="PDF Preview" 
                    width="100%" 
                    height="500px"
                    frameBorder="0"
                  ></iframe>
                </div>
              </div>
            ) : (
              <div className="No-pdf">
                <p>No file selected</p>
                <p>Upload a PDF file to preview it here</p>
              </div>
            )}
          </div>
        </div>

        {showQuizModal && generatedQuiz && (
          <div className="Quiz-modal-overlay">
            <div className="Quiz-modal">
              <div className="Modal-header">
                <h2>Edit Generated Quiz</h2>
                <button 
                  className="Close-modal"
                  onClick={() => setShowQuizModal(false)}
                >
                  &times;
                </button>
              </div>
              
              <div className="Modal-body">
                <div className="Quiz-info">
                  <input
                    type="text"
                    value={generatedQuiz.title}
                    onChange={(e) => setGeneratedQuiz({
                      ...generatedQuiz,
                      title: e.target.value
                    })}
                    placeholder="Quiz Title"
                    className="Quiz-title-input"
                  />
                  <textarea
                    value={generatedQuiz.description}
                    onChange={(e) => setGeneratedQuiz({
                      ...generatedQuiz,
                      description: e.target.value
                    })}
                    placeholder="Quiz Description"
                    className="Quiz-description-input"
                  />
                </div>

                <div className="Questions-container">
                  {editedQuestions.map((question, qIndex) => (
                    <div key={qIndex} className="Question-card">
                      <div className="Question-header">
                        <h3>Question {qIndex + 1}</h3>
                        <button 
                          className="Remove-question"
                          onClick={() => removeQuestion(qIndex)}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Deleting...' : 'Remove'}
                        </button>
                      </div>
                      
                      <textarea
                        value={question.text}
                        onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                        placeholder="Enter question text..."
                        className="Question-text-input"
                      />
                      
                      <div className="Choices-container">
                        <h4>Options:</h4>
                        {question.choices.map((choice, cIndex) => (
                          <div key={cIndex} className="choice-item">
                            <input
                              type="radio"
                              name={`correct-answer-${qIndex}`}
                              checked={choice.is_correct}
                              onChange={() => handleCorrectAnswerChange(qIndex, cIndex)}
                              className="Correct-answer-radio"
                            />
                            <input
                              type="text"
                              value={choice.text}
                              onChange={(e) => handleChoiceChange(qIndex, cIndex, e.target.value)}
                              placeholder={`Option ${cIndex + 1}`}
                              className="Choice-text-input"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    className="Add-question"
                    onClick={addQuestion}
                  >
                    + Add Question
                  </button>
                </div>
              </div>
              
              <div className="Modal-actions">
                <button 
                  className="Save-quiz"
                  onClick={saveQuiz}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Quiz'}
                </button>
                <button 
                  className="Cancel-quiz"
                  onClick={() => setShowQuizModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherModuleDetail;