import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaCloudUploadAlt, FaImage, FaTrash } from 'react-icons/fa';

const LogoUploader = ({ label, currentImage, onFileSelect, onDelete, accept = { 'image/*': [] } }) => {
    const [preview, setPreview] = useState(currentImage);

    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles?.length > 0) {
            const file = acceptedFiles[0];
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
            onFileSelect(file);
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxFiles: 1
    });

    const handleDelete = (e) => {
        e.stopPropagation();
        setPreview(null);
        if (onDelete) onDelete();
    };

    return (
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}
                `}
                style={{ minHeight: '160px' }}
            >
                <input {...getInputProps()} />

                {preview ? (
                    <div className="relative group">
                        <img
                            src={preview.startsWith('blob:') ? preview : `${import.meta.env.VITE_API_URL}/${preview}`}
                            alt="Logo Preview"
                            className="max-h-32 object-contain"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Error'; }}
                        />
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <FaTrash size={12} />
                        </button>
                    </div>
                ) : (
                    <div className="text-center text-gray-400">
                        <FaImage className="mx-auto h-10 w-10 mb-2" />
                        <p className="text-sm">
                            {isDragActive ? "Drop image here" : "Drag & drop or click to upload"}
                        </p>
                        <p className="text-xs mt-1 text-gray-400">PNG, JPG, SVG up to 2MB</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LogoUploader;
