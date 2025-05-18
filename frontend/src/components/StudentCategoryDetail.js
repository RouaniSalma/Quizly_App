import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './StudentCategoryDetail.css';

const StudentCategoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  const fetchModuleData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:8000/api/student/categories/${id}/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      setModule(response.data);

      // If there's a PDF associated with the module, set it
      if (response.data.pdfs && response.data.pdfs.length > 0) {
        setPdfFile({
          id: response.data.pdfs[0].id,
          name: response.data.pdfs[0].titre,
          url: `http://localhost:8000${response.data.pdfs[0].fichier}`,
          isNew: false
        });
      }
    } catch (error) {
      console.error('Error fetching category data:', error);
      setError('Failed to load category data');
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

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
    if (files.length === 0) {
      setError('Please upload only PDF files');
      return;
    }
    handleFile(files[0]);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
    if (files.length === 0) {
      setError('Please upload only PDF files');
      return;
    }
    handleFile(files[0]);
  };

  const handleFile = (file) => {
    setPdfFile({
      file,
      id: `local-${Date.now()}`,
      name: file.name,
      url: URL.createObjectURL(file),
      isNew: true
    });
    setError(null);
    setGeneratedQuiz(null);
  };

  const deletePdf = async () => {
    if (!pdfFile) return;

    setIsLoading(true);
    try {
      if (!pdfFile.isNew) {
        await axios.delete(
          `http://localhost:8000/api/student/categories/${id}/pdfs/${pdfFile.id}/`, 
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          }
        );
      }
      
      // Libérer l'URL de l'objet blob si c'est un nouveau fichier
      if (pdfFile.url && pdfFile.isNew) {
        URL.revokeObjectURL(pdfFile.url);
      }
      
      setPdfFile(null);
      setGeneratedQuiz(null);
      setError(null);
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
        `http://localhost:8000/api/student/categories/${id}/upload/`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Update with the saved PDF
      const pdfUrl = `http://localhost:8000${response.data.fichier}`;
      setPdfFile({
        id: response.data.id,
        name: response.data.titre,
        url: pdfUrl,
        isNew: false
      });
    } catch (error) {
      setError(error.response?.data?.error || 'Upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuiz = async () => {
    if (!pdfFile) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `http://localhost:8000/api/student/categories/${id}/generate_quiz/`, 
        null,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        }
      );

      setGeneratedQuiz(response.data);
      setUserAnswers(response.data.questions.map(question => ({
        questionId: question.id,
        answer: null
      })));
      setShowQuizModal(true);
      setQuizSubmitted(false);
      setScore(null);
    } catch (error) {
      console.error("Quiz generation failed:", error);
      setError(error.response?.data?.error || 'Failed to generate quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, choiceIndex) => {
    if (quizSubmitted) return;

    const newAnswers = [...userAnswers];
    newAnswers[questionIndex].answer = choiceIndex;
    setUserAnswers(newAnswers);
  };

  const submitQuiz = async () => {
    if (!generatedQuiz) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `http://localhost:8000/api/student/quizzes/${generatedQuiz.id}/submit/`,
        {
          answers: userAnswers.map(answer => ({
            question_id: answer.questionId,
            selected_choice_index: answer.answer
          }))
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setScore(response.data.score);
      setQuizSubmitted(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setError(error.response?.data?.error || error.message || 'Failed to submit quiz');
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
      if (pdfFile && pdfFile.url && pdfFile.isNew) {
        URL.revokeObjectURL(pdfFile.url);
      }
    };
  }, [fetchModuleData]);

  if (isLoading && !module) return <div className="loading">Loading module details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!module) return <div className="error">Module not found</div>;

  return (
    <div className="module-detail-container">
      <nav className="navbar">
        <div className="navbar-left">
          <span className="logo">Quizly</span>
        </div>
        <div className="navbar-right">
          <button
            className="history-btn"
            onClick={() => navigate(`/student/categories/${id}/quizzes`)}
          >
            View Quiz History
          </button>
          <button
            className="back-button"
            onClick={() => navigate('/student/categories')}
          >
            Back to Categories
          </button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="module-content">
        <h1 className="module-title">{module.name}</h1>

        <div className="pdf-section">
          <div className="pdf-upload-section">
            <h2>Upload PDF File</h2>
            {!pdfFile && (
              <div
                className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
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
                <div className="drop-zone-content">
                  <p>Drag & drop your PDF file here or click to select</p>
                  <p className="hint">(Only one PDF file at a time)</p>
                </div>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            {pdfFile && (
              <div className="pdf-actions">
                {pdfFile.isNew ? (
                  <button
                    className="upload-btn"
                    onClick={uploadFile}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Uploading...' : 'Upload PDF'}
                  </button>
                ) : (
                  <button
                    className="generate-quiz-btn"
                    onClick={generateQuiz}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Generating...' : 'Generate Quiz'}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="pdf-preview-section">
            {pdfFile ? (
              <div className="pdf-preview-container">
                <div className="pdf-list">
                  <h3>Selected File:</h3>
                  <div className="pdf-item">
                    <span className="pdf-name">{pdfFile.name}</span>
                    <button 
                      className="delete-btn" 
                      onClick={deletePdf}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
                <div className="pdf-viewer">
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
              <div className="no-pdf">No file selected</div>
            )}
          </div>
        </div>

        {/* Quiz Modal */}
        {showQuizModal && generatedQuiz && (
          <div className="quiz-modal-overlay">
            <div className="quiz-modal">
              <div className="modal-header">
                <h2>{generatedQuiz.title}</h2>
                <p>{generatedQuiz.description}</p>
                <button 
                  className="close-modal"
                  onClick={() => setShowQuizModal(false)}
                >
                  &times;
                </button>
              </div>
              
              <div className="modal-body">
                <div className="questions-container">
                  {generatedQuiz.questions.map((question, qIndex) => (
                    <div key={qIndex} className="question-card">
                      <h3>Question {qIndex + 1}</h3>
                      <p>{question.text}</p>
                      
                      <div className="choices-container">
                        {question.choices.map((choice, cIndex) => (
                          <div key={cIndex} className="choice-item">
                            <input
                              type="radio"
                              name={`question-${qIndex}`}
                              id={`question-${qIndex}-choice-${cIndex}`}
                              checked={userAnswers[qIndex]?.answer === cIndex}
                              onChange={() => handleAnswerSelect(qIndex, cIndex)}
                              disabled={quizSubmitted}
                            />
                            <label 
                              htmlFor={`question-${qIndex}-choice-${cIndex}`}
                              className={
                                quizSubmitted 
                                  ? choice.is_correct 
                                    ? 'correct-answer' 
                                    : userAnswers[qIndex]?.answer === cIndex
                                      ? 'incorrect-answer'
                                      : ''
                                  : ''
                              }
                            >
                              {choice.text}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="modal-actions">
                {!quizSubmitted ? (
                  <button 
                    className="submit-quiz"
                    onClick={submitQuiz}
                    disabled={isLoading || userAnswers.some(a => a.answer === null)}
                  >
                    {isLoading ? 'Submitting...' : 'Submit Quiz'}
                  </button>
                ) : (
                  <div className="quiz-result">
                    <h3>Your Score: {score}/{generatedQuiz.questions.length}</h3>
                    <button 
                      className="close-quiz"
                      onClick={() => setShowQuizModal(false)}
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCategoryDetail;