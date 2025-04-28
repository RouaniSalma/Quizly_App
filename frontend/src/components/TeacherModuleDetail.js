import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './TeacherModuleDetail.css';

const TeacherModuleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);

  // Charger les détails du module et les quiz associés
  const fetchModuleData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [moduleRes, quizzesRes, pdfsRes] = await Promise.all([
        axios.get(`http://localhost:8000/api/teacher/modules/${id}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        }),
        axios.get(`http://localhost:8000/api/teacher/modules/${id}/quizzes/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        }),
        axios.get(`http://localhost:8000/api/teacher/modules/${id}/pdfs/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        })
      ]);
      
      setModule(moduleRes.data);
      setQuizzes(quizzesRes.data);
      setPdfFiles(pdfsRes.data);
    } catch (error) {
      console.error('Error fetching module data:', error);
      setError('Failed to load module data');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchModuleData();
  }, [fetchModuleData]);

  // Gestion du drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type === 'application/pdf'
    );

    if (files.length === 0) {
      setError('Please upload only PDF files');
      return;
    }

    await handleFiles(files);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files).filter(file => 
      file.type === 'application/pdf'
    );

    if (files.length === 0) {
      setError('Please upload only PDF files');
      return;
    }

    await handleFiles(files);
  };

  // Prévisualisation des fichiers avant upload
  const handleFiles = (files) => {
    const newFiles = files.map(file => ({
      file,
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      url: URL.createObjectURL(file),
      isNew: true // Pour distinguer les fichiers non encore uploadés
    }));
    
    setPdfFiles(prev => [...prev, ...newFiles]);
    setSelectedPdf(newFiles[0]);
  };

  // Supprimer un PDF
  const deletePdf = async (pdfId) => {
    if (pdfId.startsWith('local-')) {
      // Fichier non encore uploadé
      setPdfFiles(prev => prev.filter(pdf => pdf.id !== pdfId));
      if (selectedPdf?.id === pdfId) {
        setSelectedPdf(pdfFiles.length > 1 ? pdfFiles[0] : null);
      }
      return;
    }

    // Fichier déjà uploadé
    setIsLoading(true);
    try {
      await axios.delete(
        `http://localhost:8000/api/teacher/modules/${id}/pdfs/${pdfId}/`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        }
      );
      
      setPdfFiles(prev => prev.filter(pdf => pdf.id !== pdfId));
      if (selectedPdf?.id === pdfId) {
        const updatedPdfs = pdfFiles.filter(pdf => pdf.id !== pdfId);
        setPdfFiles(updatedPdfs);
        setSelectedPdf(updatedPdfs.length > 0 ? updatedPdfs[0] : null);

      }
      setUploadSuccess('PDF deleted successfully');
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting PDF:', error);
      setError('Failed to delete PDF');
    } finally {
      setIsLoading(false);
    }
  };

  // Upload des fichiers PDF
  const uploadFiles = async () => {
    const filesToUpload = pdfFiles.filter(pdf => pdf.isNew);
    if (filesToUpload.length === 0) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      filesToUpload.forEach(pdf => {
        formData.append('files', pdf.file);
      });

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

      // Mettre à jour la liste des PDFs avec les versions uploadées
      setPdfFiles(prev => [
        ...prev.filter(pdf => !pdf.isNew),
        ...response.data.map(pdf => ({
          ...pdf,
          url: `http://localhost:8000${pdf.file}` // URL du serveur
        }))
      ]);
      
      setUploadSuccess(`${filesToUpload.length} PDF(s) uploaded successfully!`);
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (error) {
      console.error('Error uploading files:', error);
      setError(error.response?.data?.error || 'Failed to upload PDFs');
    } finally {
      setIsLoading(false);
    }
  };

  // Générer un quiz
  const generateQuiz = async () => {
    if (pdfFiles.length === 0) {
      setError('Please upload at least one PDF file');
      return;
    }

    // S'assurer que tous les fichiers sont uploadés
    if (pdfFiles.some(pdf => pdf.isNew)) {
      setError('Please upload all PDF files before generating quiz');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `http://localhost:8000/api/teacher/modules/${id}/generate-quiz/`,
        { pdf_ids: pdfFiles.map(pdf => pdf.id) },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        }
      );

      setQuizzes(prev => [response.data, ...prev]);
      setUploadSuccess('Quiz generated successfully!');
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (error) {
      console.error('Error generating quiz:', error);
      setError(error.response?.data?.error || 'Failed to generate quiz');
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation
  const handleBackToModules = () => {
    navigate('/modules');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (isLoading && !module) {
    return <div className="loading">Loading module details...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!module) {
    return <div className="error">Module not found</div>;
  }

  return (
    <div className="module-detail-container">
      <nav className="navbar">
        <div className="navbar-left">
          <span className="logo">Quizly</span>
        </div>
        <div className="navbar-right">
          <button 
            className="back-button"
            onClick={handleBackToModules}
          >
            Back to Modules
          </button>
          <button 
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="module-content">
        <h1 className="module-title">{module.name}</h1>
        
        <div className="pdf-section">
          <div className="pdf-upload-section">
            <h2>Upload PDF Files</h2>
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
                multiple 
                accept="application/pdf" 
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <div className="drop-zone-content">
                <p>Drag & drop your PDF files here or click to select</p>
                <p className="hint">(Only PDF files are accepted)</p>
              </div>
            </div>

            {uploadSuccess && (
              <div className="success-message">{uploadSuccess}</div>
            )}

            {pdfFiles.length > 0 && (
              <div className="pdf-actions">
                <button 
                  className="upload-btn"
                  onClick={uploadFiles}
                  disabled={isLoading || !pdfFiles.some(pdf => pdf.isNew)}
                >
                  {isLoading ? 'Uploading...' : 'Upload All PDFs'}
                </button>
                <button 
                  className="generate-quiz-btn"
                  onClick={generateQuiz}
                  disabled={isLoading || pdfFiles.some(pdf => pdf.isNew)}
                >
                  {isLoading ? 'Generating...' : 'Generate Quiz'}
                </button>
              </div>
            )}
          </div>

          <div className="pdf-preview-section">
            {pdfFiles.length > 0 ? (
              <div className="pdf-preview-container">
                <div className="pdf-list">
                  <h3>Uploaded Files:</h3>
                  <ul>
                    {pdfFiles.map((pdf) => (
                      <li 
                        key={pdf.id} 
                        className={selectedPdf?.id === pdf.id ? 'active' : ''}
                        onClick={() => setSelectedPdf(pdf)}
                      >
                        <span>{pdf.name}</span>
                        <button 
                          className="delete-pdf-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePdf(pdf.id);
                          }}
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="pdf-viewer">
                  {selectedPdf && (
                    <>
                      <h3>Preview: {selectedPdf.name}</h3>
                      <iframe 
                        src={selectedPdf.url} 
                        title="PDF Preview"
                        width="100%" 
                        height="500px"
                      />
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="no-pdfs">
                <p>No PDFs uploaded yet. Add a PDF to get started!</p>
              </div>
            )}
          </div>
        </div>

        <div className="quiz-history-section">
          <h2>Quiz History</h2>

          {quizzes.length === 0 ? (
            <div className="empty-quiz-history">
              <p>No quizzes generated yet for this module. Add a PDF to get started!</p>
            </div>
          ) : (
            <div className="quiz-list">
              {quizzes.map(quiz => (
                <div className="quiz-card" key={quiz.id}>
                  <div className="quiz-info">
                    <h3>Quiz #{quiz.id}</h3>
                    <p>Generated on: {new Date(quiz.created_at).toLocaleString()}</p>
                    <p>Questions: {quiz.question_count || 'N/A'}</p>
                  </div>
                  <div className="quiz-actions">
                    <button 
                      className="view-quiz-btn"
                      onClick={() => navigate(`/modules/${id}/quizzes/${quiz.id}`)}
                    >
                      View
                    </button>
                    <button 
                      className="retake-quiz-btn"
                      onClick={() => navigate(`/modules/${id}/quizzes/${quiz.id}/retake`)}
                    >
                      Retake
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherModuleDetail;