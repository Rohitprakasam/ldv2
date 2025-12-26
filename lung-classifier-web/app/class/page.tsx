"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function ClassifyPage() {
    const [file, setFile] = useState<File | null>(null);
    const [patientDetails, setPatientDetails] = useState({ id: '', name: '', age: '', history: '' });
    const [prediction, setPrediction] = useState<string | null>(null);
    const [reportUrl, setReportUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setImagePreview(URL.createObjectURL(selectedFile));
            setPrediction(null);
            setReportUrl(null);
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setError(null);
        setReportUrl(null);

        const formData = new FormData();
        formData.append('image', file);
        formData.append('id', patientDetails.id);
        formData.append('name', patientDetails.name);
        formData.append('age', patientDetails.age);
        formData.append('history', patientDetails.history);

        try {
            const res = await fetch('http://localhost:5000/api/predict', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                throw new Error('Failed to fetch prediction');
            }

            const data = await res.json();
            setPrediction(data.prediction);
            setReportUrl(data.report_url);
        } catch (err) {
            setError('Error processing image. Ensure backend is running.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#121212] text-cyan-400 font-sans flex flex-col items-center justify-center p-4">

            <div className="absolute top-4 left-4 z-50">
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                    &larr; Back to Home
                </Link>
            </div>

            <h1 className="text-4xl font-bold mb-8 text-center animate-pulse drop-shadow-[0_0_10px_rgba(0,225,255,0.8)]">
                Lung Disease Classification
            </h1>

            <div className="bg-gray-900 border-2 border-cyan-500 rounded-xl p-8 shadow-[0_0_30px_rgba(0,225,255,0.3)] w-full max-w-md relative z-10">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                    {/* Patient Details Form */}
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Patient ID"
                            className="w-full bg-gray-800 text-white border border-gray-600 rounded p-2 focus:border-cyan-400 outline-none"
                            value={patientDetails.id}
                            onChange={(e) => setPatientDetails({ ...patientDetails, id: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Patient Name"
                            className="w-full bg-gray-800 text-white border border-gray-600 rounded p-2 focus:border-cyan-400 outline-none"
                            value={patientDetails.name}
                            onChange={(e) => setPatientDetails({ ...patientDetails, name: e.target.value })}
                            required
                        />
                        <input
                            type="number"
                            placeholder="Age"
                            className="w-full bg-gray-800 text-white border border-gray-600 rounded p-2 focus:border-cyan-400 outline-none"
                            value={patientDetails.age}
                            onChange={(e) => setPatientDetails({ ...patientDetails, age: e.target.value })}
                            required
                        />
                        <textarea
                            placeholder="Medical History (Optional)"
                            className="w-full bg-gray-800 text-white border border-gray-600 rounded p-2 focus:border-cyan-400 outline-none h-24"
                            value={patientDetails.history}
                            onChange={(e) => setPatientDetails({ ...patientDetails, history: e.target.value })}
                        />
                    </div>

                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg p-6 hover:border-cyan-400 transition-colors cursor-pointer relative"
                        onClick={() => document.getElementById('fileInput')?.click()}>

                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="max-h-64 object-contain rounded" />
                        ) : (
                            <div className="text-center">
                                <p className="text-gray-400 mb-2">Click to Upload X-Ray</p>
                                <span className="text-4xl">📁</span>
                            </div>
                        )}

                        <input
                            id="fileInput"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!file || loading}
                        className={`
                py-3 px-6 rounded-lg font-bold text-black transition-all transform hover:scale-105
                ${!file || loading
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-gradient-to-r from-cyan-400 to-green-400 hover:shadow-[0_0_20px_#56ff62]'
                            }
            `}
                    >
                        {loading ? 'Analyzing...' : 'Predict Disease'}
                    </button>
                </form>

                {error && (
                    <p className="mt-4 text-red-500 text-center font-bold">{error}</p>
                )}

                {prediction && (
                    <div className="mt-6 text-center animate-fade-in-up">
                        <h2 className="text-2xl text-white mb-2">Result:</h2>
                        <p className="text-3xl font-extrabold text-green-400 drop-shadow-[0_0_10px_rgba(86,255,98,0.8)]">
                            {prediction}
                        </p>

                        {reportUrl && (
                            <a
                                href={reportUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block mt-4 text-cyan-400 underline hover:text-cyan-200"
                            >
                                📄 Download Detailed PDF Report
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
