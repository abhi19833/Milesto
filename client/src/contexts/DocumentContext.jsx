import React, { createContext, useContext, useState } from "react";
import toast from "react-hot-toast";

const DocumentContext = createContext();

export const useDocument = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error("useDocument must be used inside a DocumentProvider");
  }
  return context;
};

export const DocumentProvider = ({ children }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async (projectId) => {
    try {
      setLoading(true);
      const response = [];
      const filteredDocs = projectId
        ? response.filter((doc) => doc.projectId === projectId)
        : response;

      setDocuments(filteredDocs);
    } catch (err) {
      toast.error("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file, projectId, tags = []) => {
    try {
      setLoading(true);

      const allowedTypes = [
        "pdf",
        "docx",
        "xlsx",
        "pptx",
        "sql",
        "txt",
        "md",
        "fig",
      ];
      const fileExtension = file.name.split(".").pop().toLowerCase();

      if (!allowedTypes.includes(fileExtension)) {
        throw new Error("Unsupported file type");
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File too large (max 10MB)");
      }

      const newDoc = {
        id: Date.now().toString(),
        name: file.name,
        type: fileExtension,
        size: formatFileSize(file.size),
        uploadedAt: new Date().toISOString(),
        projectId,
        tags,
        url: URL.createObjectURL(file),
        analyzed: false,
        aiInsights: null,
      };

      setDocuments((prev) => [...prev, newDoc]);
      toast.success("Document uploaded successfully");
      return newDoc;
    } catch (err) {
      toast.error(err.message || "Upload failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const analyzeDocument = async (documentId) => {
    try {
      const doc = documents.find((d) => d.id === documentId);
      if (!doc) return;

      const updatedDoc = {
        ...doc,
        analyzed: true,
        aiInsights: "AI insights here",
      };

      setDocuments((prev) =>
        prev.map((d) => (d.id === documentId ? updatedDoc : d))
      );
      toast.success("Document analyzed successfully");
      return updatedDoc;
    } catch (err) {
      toast.error("Failed to analyze document");
      throw err;
    }
  };

  const deleteDocument = async (documentId) => {
    try {
      setLoading(true);
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      toast.success("Document deleted");
    } catch (err) {
      toast.error("Failed to delete document");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (documentId) => {
    try {
      const doc = documents.find((d) => d.id === documentId);
      if (doc) {
        const link = document.createElement("a");
        link.href = doc.url;
        link.download = doc.name;
        link.click();
        toast.success("Download started");
      }
    } catch (err) {
      toast.error("Failed to download document");
    }
  };

  const updateDocumentTags = async (documentId, tags) => {
    try {
      const updatedDoc = {
        ...documents.find((d) => d.id === documentId),
        tags,
      };
      setDocuments((prev) =>
        prev.map((d) => (d.id === documentId ? updatedDoc : d))
      );
      toast.success("Tags updated");
    } catch (err) {
      toast.error("Failed to update tags");
    }
  };

  const getDocumentsByProject = (projectId) =>
    documents.filter((d) => d.projectId === projectId);

  const getDocumentsByType = (type) => documents.filter((d) => d.type === type);

  const getAnalyzedDocuments = () => documents.filter((d) => d.analyzed);

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const value = {
    documents,
    loading,
    fetchDocuments,
    uploadDocument,
    analyzeDocument,
    deleteDocument,
    downloadDocument,
    updateDocumentTags,
    getDocumentsByProject,
    getDocumentsByType,
    getAnalyzedDocuments,
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};
