import React, { useState } from 'react';
import { Document, Page } from 'react-pdf';
import './ModuleForm.css'; // Assure-toi de styliser avec tes couleurs

const ModuleForm = () => {
    const [moduleName, setModuleName] = useState('');
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfPreview, setPdfPreview] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPdfFile(file);
            setPdfPreview(URL.createObjectURL(file)); // Pour afficher le PDF en prévisualisation
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Gérer l'envoi des données au backend
        console.log('Module créé avec:', moduleName, pdfFile);
    };

    return (
        <div className="module-form">
            <h2>Créer un Module</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Nom du module"
                    value={moduleName}
                    onChange={(e) => setModuleName(e.target.value)}
                    required
                />
                <div className="file-upload">
                    <input type="file" onChange={handleFileChange} accept="application/pdf" />
                    {pdfPreview && (
                        <div className="pdf-preview">
                            <Document file={pdfPreview}>
                                <Page pageNumber={1} />
                            </Document>
                            <button onClick={() => setPdfFile(null)}>Supprimer le fichier</button>
                        </div>
                    )}
                </div>
                <button type="submit">Créer le Module</button>
            </form>
        </div>
    );
};

export default ModuleForm;
