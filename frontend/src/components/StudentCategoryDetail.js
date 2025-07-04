import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/axiosInstance';
import { useParams, useNavigate } from 'react-router-dom';
import './StudentCategoryDetail.css';
import { fetchWithAuth } from '../services/fetchWithAuth';
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
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fileUploaded, setFileUploaded] = useState(false);
  //student passe quiz prof
  const [showQuizLinkModal, setShowQuizLinkModal] = useState(false);
const [quizLink, setQuizLink] = useState('');
const [sharedQuiz, setSharedQuiz] = useState(null);
const [sharedQuizLoading, setSharedQuizLoading] = useState(false);
const [sharedQuizError, setSharedQuizError] = useState(null);
const [accessId, setAccessId] = useState(null);

const handleQuizLinkSubmit = async () => {
  if (!quizLink.trim()) {
    setSharedQuizError('Please enter a valid quiz link');
    return;
  }

  try {
    setSharedQuizLoading(true);
    setSharedQuizError(null);
    
    // Extraire l'ID et le token
    const match = quizLink.match(/\/(?:api\/teacher\/)?quizzes?\/(\d+)\/access\/([a-f0-9-]+)\/?/i);
if (!match) {
  throw new Error('Invalid quiz link format');
}
const quizId = match[1];
const accessToken = match[2];
    
    console.log('Extracted:', { quizId, accessToken }); // Debug
    
    const response = await api.get(
      `http://localhost:8000/api/teacher/quiz/${quizId}/access/${accessToken}/`,
      {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      }
    );
    
    console.log('API Response:', response.data); // Debug
    
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    
    setSharedQuiz(response.data);
    setShowQuizLinkModal(false);
    setShowQuizModal(true);
    setUserAnswers(response.data.questions.map(question => ({
      questionId: question.id,
      answer: null
    })));
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      response: error.response,
    });
    
    setSharedQuizError(
      error.response?.data?.error || 
      error.message || 
      'Failed to access quiz. Please check the link.'
    );
  } finally {
    setSharedQuizLoading(false);
  }
};


  // Constantes pour les limites
  // Configuration sécurisée pour la production
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 Mo
const MAX_FILE_SIZE_MO = (MAX_FILE_SIZE / 1048576).toFixed(2);

  const fetchWithAuthWithAuthModuleData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`http://localhost:8000/api/student/categories/${id}/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      setModule(response.data);

      // If there's a PDF associated with the module, set it
      if (response.data.pdfs && response.data.pdfs.length > 0) {
        setPdfFile({
          id: response.data.pdfs[0].id,
          name: response.data.pdfs[0].titre,
          url: `http://localhost:8000${response.data.pdfs[0].fichier}`,
          size: response.data.pdfs[0].size,
          isNew: false
        });
        setFileUploaded(true);
      }
    } catch (error) {
      console.error('Error fetchWithAuthWithAuthing category data:', error);
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
    setFileUploaded(false);
    setError(null);
    setGeneratedQuiz(null);
  };

  const deletePdf = async () => {
    if (!pdfFile) return;

    setIsLoading(true);
    try {
      if (!pdfFile.isNew) {
        await api.delete(
          `http://localhost:8000/api/student/categories/${id}/pdfs/${pdfFile.id}/`, 
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          }
        );
      }
      
      if (pdfFile.url && pdfFile.isNew) {
        URL.revokeObjectURL(pdfFile.url);
      }
      
      setPdfFile(null);
      setFileUploaded(false);
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

      const response = await api.post(
        `http://localhost:8000/api/student/categories/${id}/upload/`,
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
      setFileUploaded(true);
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
      const response = await api.post(
        `http://localhost:8000/api/student/categories/${id}/generate_quiz/`, 
        null,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        }
      );

      const formattedQuestions = response.data.questions.map(question => ({
        questionId: question.id,
        answer: null
      }));

      setGeneratedQuiz(response.data);
      setUserAnswers(formattedQuestions);
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

    setUserAnswers(prevAnswers => {
      const newAnswers = [...prevAnswers];
      newAnswers[questionIndex] = {
        ...newAnswers[questionIndex],
        answer: choiceIndex
      };
      return newAnswers;
    });
  };
 const submitSharedQuiz = async () => {
  if (!sharedQuiz || !accessId) return;

  const hasUnanswered = userAnswers.some(answer => answer.choiceId === null);
  if (hasUnanswered) {
    setErrorMessage("Please answer all questions before submitting.");
    setShowErrorModal(true);
    return;
  }

  try {
    const response = await api.post(
      `http://localhost:8000/api/teacher/quiz/submit/${accessId}/`,
      {
        answers: userAnswers.map(answer => ({
          question_id: answer.questionId,
          choice_id: answer.choiceId
        }))
      },
      { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
    );
    
    setScore(response.data.score);
    setQuizSubmitted(true);
  } catch (error) {
    setError("Failed to submit quiz: " + (error.response?.data?.error || error.message));
  }
};
  const submitQuiz = async () => {
  if (!generatedQuiz && !sharedQuiz) return;

  const quizId = sharedQuiz ? sharedQuiz.id : generatedQuiz.id;
  const hasUnanswered = userAnswers.some(answer => answer.answer === null);
  
  if (hasUnanswered) {
    setErrorMessage("Please answer all questions before submitting.");
    setShowErrorModal(true);
    return;
  }

  setIsLoading(true);
  try {
    const endpoint = sharedQuiz 
      ? `http://localhost:8000/api/student/shared-quiz/${quizId}/submit/`
      : `http://localhost:8000/api/student/quizzes/${quizId}/submit/`;

    const response = await api.post(
      endpoint,
      {
        answers: userAnswers.map(answer => ({
          question_id: answer.questionId,
          selected_choice_index: answer.answer
        }))
      },
      { 
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});

    setScore(response.data.score);
    setQuizSubmitted(true);
    
    // Réinitialiser le quiz partagé après soumission
    if (sharedQuiz) {
      setSharedQuiz(null);
    }
  } catch (error) {
    setError("Failed to submit quiz: " + (error.response?.data?.error || error.message));
  } finally {
    setIsLoading(false);
  }
};

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    fetchWithAuthWithAuthModuleData();
    return () => {
      if (pdfFile && pdfFile.url && pdfFile.isNew) {
        URL.revokeObjectURL(pdfFile.url);
      }
    };
  }, [fetchWithAuthWithAuthModuleData]);

  if (isLoading && !module) return <div className="-loading">Loading module details...</div>;
  if (error) return <div className="-error">{error}</div>;
  if (!module) return <div className="-error">Module not found</div>;

  return (
    <div className="-module-detail-container">
      <nav className="-navbar">
        <div className="-navbar-left">
          <span className="-logo">Quizly</span>
        </div>
        <div className="-navbar-right">
          <button
            className="-back-button"
            onClick={() => navigate('/student/categories')}
          >
            Back to Categories
          </button>
          <button
            className="-history-btn"
            onClick={() => navigate(`/student/categories/${id}/quizzes`)}
          >
            View Quiz History
          </button>
          <button
  className="-take-quiz-btn"
  onClick={() => setShowQuizLinkModal(true)}
>
  Take Shared Quiz
</button>
 <button className= "dash_student" onClick={() => navigate('/student/dashboard')}>
        Voir le Dashboard
      </button>
          <button className="-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="-module-content">
        <h1 className="-module-title">{module.name}</h1>

        <div className="-pdf-section">
          <div className="-pdf-upload-section">
            <h2>Upload your PDF file</h2>
<div className="-upload-info">
  <p><strong>File Requirements :</strong></p>
  <ul>
    <li>Format: PDF only</li>
    <li>Maximum size: 3.00 Mo</li>
    <li>Approximately 2000 words or 6-8 pages of text</li>
    <li>We'll generate 5 questions from your document</li>
  </ul>
</div>

            {showErrorModal && (
              <div className="-error-modal-overlay">
                <div className="-error-modal">
                  <div className="-modal-header">
                    <h3>Error</h3>
                    <button 
                      className="-close-modal"
                      onClick={() => setShowErrorModal(false)}
                    >
                      &times;
                    </button>
                  </div>
                  <div className="-modal-body">
                    <p>{errorMessage}</p>
                  </div>
                  <div className="-modal-actions">
                    <button 
                      className="-back-button"
                      onClick={() => setShowErrorModal(false)}
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!pdfFile && (
              <div
                className={`-drop-zone ${isDragOver ? '-drag-over' : ''} ${error ? '-error-zone' : ''}`}
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
                <div className="-drop-zone-content">
                  <p>Drag & drop your PDF file here or click to select</p>
                  <p className="-hint">(Only one PDF file at a time)</p>
                </div>
              </div>
            )}

            {error && <div className="-error-message">{error}</div>}

            {pdfFile && (
              <div className="-pdf-actions">
                <div className="-file-info">
                  <span className="-file-name">{pdfFile.name}</span>
                  <span className="-file-size">({(pdfFile.size / 1048576).toFixed(2)} MB)</span>
                </div>
                <div className="-pdf-buttons-container">
                  {pdfFile.isNew && !fileUploaded ? (
                    <>
                      <button
                        className="-upload-btn"
                        onClick={uploadFile}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Uploading...' : 'Upload PDF'}
                      </button>
                      <button 
                        className="-delete-btn" 
                        onClick={deletePdf}
                        disabled={isLoading}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="-generate-quiz-btn"
                        onClick={generateQuiz}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Generating...' : 'Generate Quiz'}
                      </button>
                      {!fileUploaded && (
                        <button 
                          className="-delete-btn" 
                          onClick={deletePdf}
                          disabled={isLoading}
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="-pdf-preview-section">
            {pdfFile ? (
              <div className="-pdf-preview-container">
                <div className="-pdf-viewer">
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
              <div className="-no-pdf">
                <p>No file selected</p>
                <p>Upload a PDF file to preview it here</p>
              </div>
            )}
          </div>
        </div>

        {showQuizModal && (generatedQuiz || sharedQuiz) && (
  <div className="-quiz-modal-overlay">
    <div className="-quiz-modal">
      <div className="-modal-header">
        <h2>{sharedQuiz ? sharedQuiz.title : generatedQuiz.title}</h2>
        <p>{sharedQuiz ? sharedQuiz.description : generatedQuiz.description}</p>
        <button 
          className="-close-modal"
          onClick={() => {
            setShowQuizModal(false);
            setSharedQuiz(null); // Reset shared quiz when closing
          }}
        >
          &times;
        </button>
      </div>
      
      <div className="-modal-body">
        <div className="-questions-container">
          {(sharedQuiz ? sharedQuiz.questions : generatedQuiz.questions).map((question, qIndex) => (
            <div key={question.id} className="question-card">
                      <h3>Question {qIndex + 1}</h3>
                      <p>{question.text}</p>
                      
                      <div className="-choices-container">
                        {question.choices.map((choice, cIndex) => {
                          const isSelected = userAnswers[qIndex]?.answer === cIndex;
                          const isCorrect = choice.is_correct;
                          const showCorrect = quizSubmitted && isCorrect;
                          const showIncorrect = quizSubmitted && isSelected && !isCorrect;
                          
                          return (
                            <div key={cIndex} className="-choice-item">
                              <input
                                type="radio"
                                name={`question-${qIndex}`}
                                id={`question-${qIndex}-choice-${cIndex}`}
                                checked={isSelected}
                                onChange={() => handleAnswerSelect(qIndex, cIndex)}
                                disabled={quizSubmitted}
                              />
                              <label 
                                htmlFor={`question-${qIndex}-choice-${cIndex}`}
                                className={`
                                  ${showCorrect ? '-correct-answer' : ''}
                                  ${showIncorrect ? '-incorrect-answer' : ''}
                                `}
                              >
                                {choice.text}
                                {showCorrect && <span> ✓</span>}
                                {showIncorrect && <span> ✗</span>}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                      
                      {quizSubmitted }
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="-modal-actions">
                {!quizSubmitted ? (
                  <button 
                    className="-submit-quiz"
                    onClick={submitQuiz}
                    disabled={isLoading || userAnswers.some(a => a.answer === null)}
                  >
                    {isLoading ? 'Submitting...' : 'Submit Quiz'}
                    {userAnswers.some(a => a.answer === null) && 
                      <span className="-incomplete-warning"> (Please answer all questions)</span>}
                  </button>
                ) : (
                  <div className="-quiz-result">
                    <h3>Your Score: {score}/{generatedQuiz.questions.length}</h3>
                    <p className="-score-message">
                      {score === generatedQuiz.questions.length ? "Perfect! 🎉" :
                       score >= generatedQuiz.questions.length * 0.7 ? "Good job! 👍" :
                       "Keep practicing! 💪"}
                    </p>
                    <button 
                      className="-close-quiz"
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
        {showQuizLinkModal && (
  <div className="-quiz-link-modal-overlay">
    <div className="-quiz-link-modal">
      <div className="-modal-header">
        <h2>Enter Quiz Link</h2>
        <button 
          className="-close-modal"
          onClick={() => {
            setShowQuizLinkModal(false);
            setQuizLink('');
            setSharedQuizError(null);
          }}
        >
          &times;
        </button>
      </div>
      
      <div className="-modal-body">
        <p>Paste the quiz link shared by your teacher:</p>
        <input
  type="text"
  value={quizLink}
  onChange={(e) => setQuizLink(e.target.value)}
  placeholder="http://localhost:8000/api/teacher/quiz/40/access/1d1b76d1-1960-4d7d-be38-81e6b5875213/"
  className="-quiz-link-input"
  style={{ width: '100%' }}  // Ajoutez ce style pour éviter le tronquage
/>
        {sharedQuizError && <div className="-error-message">{sharedQuizError}</div>}
      </div>
      
      <div className="-modal-actions">
        <button
  className="-submit-link-btn"
  onClick={handleQuizLinkSubmit}
  disabled={sharedQuizLoading || sharedQuizError} // Désactive le bouton si erreur ou chargement
>
  {sharedQuizLoading ? 'Loading...' : 'Start Quiz'}
</button>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default StudentCategoryDetail;