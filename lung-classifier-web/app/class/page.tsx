"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const API_BASE_URL = "http://localhost:5000";

type ReportRecord = {
    patient_id: string;
    rfid_uid: string;
    name: string;
    age: string;
    history: string;
    prediction: string;
    confidence: number;
    report_url: string;
    report_filename: string;
    created_at: string;
};

type LatestScan = {
    uid: string;
    scanned_at: string;
};

type RfidOwner = {
    patient_id: string;
    name: string;
    age: string;
    rfid_uid: string;
    last_report_at?: string;
    last_prediction?: string;
};

const emptyPatient = {
    id: "",
    name: "",
    age: "",
    history: "",
    rfid_uid: "",
};

function formatDate(value: string) {
    if (!value) return "Unknown time";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString();
}

export default function ClassifyPage() {
    const [file, setFile] = useState<File | null>(null);
    const [patientDetails, setPatientDetails] = useState(emptyPatient);
    const [prediction, setPrediction] = useState<string | null>(null);
    const [reportUrl, setReportUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [lookupUid, setLookupUid] = useState("");
    const [latestScan, setLatestScan] = useState<LatestScan | null>(null);
    const [reports, setReports] = useState<ReportRecord[]>([]);
    const [lookupMessage, setLookupMessage] = useState("Waiting for card tap");
    const [rfidOwner, setRfidOwner] = useState<RfidOwner | null>(null);
    const [ownerCheckLoading, setOwnerCheckLoading] = useState(false);

    const hasReports = reports.length > 0;
    const cardLinkedToAnotherPatient = Boolean(
        rfidOwner && patientDetails.id.trim() && rfidOwner.patient_id !== patientDetails.id.trim()
    );
    const canSubmit = Boolean(
        file && patientDetails.id && patientDetails.name && patientDetails.age && !loading && !cardLinkedToAnotherPatient
    );

    const scanAge = useMemo(() => {
        if (!latestScan?.scanned_at) return "No scan";
        return formatDate(latestScan.scanned_at);
    }, [latestScan?.scanned_at]);

    const loadReportsByUid = async (uid: string) => {
        const cleanedUid = uid.trim();
        if (!cleanedUid) {
            setLookupMessage("Enter an RFID UID");
            setReports([]);
            return;
        }

        try {
            setLookupMessage("Fetching reports");
            const res = await fetch(`${API_BASE_URL}/api/rfid/${encodeURIComponent(cleanedUid)}/reports`);
            if (!res.ok) {
                throw new Error("Failed to fetch RFID reports");
            }

            const data = await res.json();
            const nextReports = data.reports || [];
            setReports(nextReports);
            setLookupMessage(nextReports.length ? "Reports found" : "No reports found for this card");
        } catch (err) {
            setLookupMessage("Backend unavailable");
            console.error(err);
        }
    };

    useEffect(() => {
        const loadLatestScan = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/rfid/latest`);
                if (!res.ok) return;

                const data = await res.json();
                if (data.scan?.uid && data.scan.scanned_at !== latestScan?.scanned_at) {
                    const nextReports = data.reports || [];
                    setLatestScan(data.scan);
                    setLookupUid(data.scan.uid);
                    setReports(nextReports);
                    setLookupMessage(nextReports.length ? "Reports found" : "No reports found for this card");
                }
            } catch (err) {
                console.error(err);
            }
        };

        loadLatestScan();
        const interval = window.setInterval(loadLatestScan, 2000);
        return () => window.clearInterval(interval);
    }, [latestScan?.scanned_at]);

    useEffect(() => {
        const uid = patientDetails.rfid_uid.trim();
        if (!uid) {
            setRfidOwner(null);
            return;
        }

        const controller = new AbortController();
        const checkOwner = async () => {
            try {
                setOwnerCheckLoading(true);
                const res = await fetch(`${API_BASE_URL}/api/rfid/${encodeURIComponent(uid)}/owner`, {
                    signal: controller.signal,
                });
                if (!res.ok) {
                    throw new Error("Failed to check RFID owner");
                }

                const data = await res.json();
                setRfidOwner(data.owner || null);
            } catch (err) {
                if (!controller.signal.aborted) {
                    setRfidOwner(null);
                    console.error(err);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setOwnerCheckLoading(false);
                }
            }
        };

        checkOwner();
        return () => controller.abort();
    }, [patientDetails.rfid_uid]);

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
        formData.append("image", file);
        formData.append("id", patientDetails.id);
        formData.append("name", patientDetails.name);
        formData.append("age", patientDetails.age);
        formData.append("history", patientDetails.history);
        formData.append("rfid_uid", patientDetails.rfid_uid);

        try {
            const res = await fetch(`${API_BASE_URL}/api/predict`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                if (res.status === 409 && data?.owner) {
                    setRfidOwner(data.owner);
                    setError(
                        `This RFID card is already linked to ${data.owner.name || "Unknown patient"} (Patient ID: ${data.owner.patient_id}).`
                    );
                    return;
                }
                throw new Error(data?.error || "Failed to fetch prediction");
            }

            const data = await res.json();
            setPrediction(data.prediction);
            setReportUrl(data.report_url);
            if (patientDetails.rfid_uid.trim()) {
                await loadReportsByUid(patientDetails.rfid_uid);
            }
        } catch (err) {
            setError("Unable to process image. Check that the Flask backend is running.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const useLatestCard = () => {
        if (!latestScan?.uid) return;
        setPatientDetails({ ...patientDetails, rfid_uid: latestScan.uid });
        setLookupUid(latestScan.uid);
    };

    return (
        <main className="min-h-screen bg-[#0f1417] text-slate-100">
            <header className="border-b border-slate-800 bg-[#11191d]">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                    <div>
                        <Link href="/" className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-100">
                            Back to home
                        </Link>
                        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
                            Lung Screening Workstation
                        </h1>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm sm:flex">
                        <div className="rounded-md border border-slate-700 bg-slate-900 px-4 py-3">
                            <p className="text-slate-400">RFID status</p>
                            <p className="mt-1 font-semibold text-emerald-300">{latestScan ? "Card received" : "No card"}</p>
                        </div>
                        <div className="rounded-md border border-slate-700 bg-slate-900 px-4 py-3">
                            <p className="text-slate-400">Report matches</p>
                            <p className="mt-1 font-semibold text-cyan-300">{reports.length}</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:px-8">
                <section className="rounded-md border border-slate-800 bg-[#151d21] p-5 shadow-lg shadow-black/20">
                    <div className="mb-5 flex flex-col gap-2 border-b border-slate-800 pb-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.12em] text-cyan-300">New diagnosis</p>
                            <h2 className="mt-1 text-2xl font-semibold text-white">Patient intake</h2>
                        </div>
                        <button
                            type="button"
                            onClick={useLatestCard}
                            disabled={!latestScan?.uid}
                            className="h-10 rounded-md border border-slate-700 px-4 text-sm font-semibold text-slate-100 transition-colors hover:border-cyan-400 disabled:cursor-not-allowed disabled:text-slate-500"
                        >
                            Use latest tap
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block">
                                <span className="text-sm font-medium text-slate-300">Patient ID</span>
                                <input
                                    type="text"
                                    className="mt-2 h-11 w-full rounded-md border border-slate-700 bg-[#0f1417] px-3 text-white outline-none transition-colors focus:border-cyan-400"
                                    value={patientDetails.id}
                                    onChange={(e) => setPatientDetails({ ...patientDetails, id: e.target.value })}
                                    required
                                />
                            </label>
                            <label className="block">
                                <span className="text-sm font-medium text-slate-300">RFID UID</span>
                                <input
                                    type="text"
                                    className="mt-2 h-11 w-full rounded-md border border-slate-700 bg-[#0f1417] px-3 font-mono text-white outline-none transition-colors focus:border-cyan-400"
                                    value={patientDetails.rfid_uid}
                                    onChange={(e) => setPatientDetails({ ...patientDetails, rfid_uid: e.target.value })}
                                />
                                {ownerCheckLoading && (
                                    <p className="mt-2 text-xs text-slate-500">Checking card ownership...</p>
                                )}
                                {rfidOwner && !cardLinkedToAnotherPatient && (
                                    <div className="mt-2 rounded-md border border-emerald-500/40 bg-emerald-950/30 p-3 text-sm text-emerald-100">
                                        This card is linked to {rfidOwner.name || "Unknown patient"}.
                                    </div>
                                )}
                                {rfidOwner && cardLinkedToAnotherPatient && (
                                    <div className="mt-2 rounded-md border border-amber-500/50 bg-amber-950/40 p-3 text-sm text-amber-100">
                                        <p className="font-semibold">This RFID card is already linked to another patient.</p>
                                        <p className="mt-1">
                                            Owner: {rfidOwner.name || "Unknown patient"} | Patient ID: {rfidOwner.patient_id}
                                        </p>
                                        {rfidOwner.last_prediction && (
                                            <p className="mt-1">
                                                Last report: {rfidOwner.last_prediction} on {formatDate(rfidOwner.last_report_at || "")}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </label>
                            <label className="block">
                                <span className="text-sm font-medium text-slate-300">Patient name</span>
                                <input
                                    type="text"
                                    className="mt-2 h-11 w-full rounded-md border border-slate-700 bg-[#0f1417] px-3 text-white outline-none transition-colors focus:border-cyan-400"
                                    value={patientDetails.name}
                                    onChange={(e) => setPatientDetails({ ...patientDetails, name: e.target.value })}
                                    required
                                />
                            </label>
                            <label className="block">
                                <span className="text-sm font-medium text-slate-300">Age</span>
                                <input
                                    type="number"
                                    min="0"
                                    className="mt-2 h-11 w-full rounded-md border border-slate-700 bg-[#0f1417] px-3 text-white outline-none transition-colors focus:border-cyan-400"
                                    value={patientDetails.age}
                                    onChange={(e) => setPatientDetails({ ...patientDetails, age: e.target.value })}
                                    required
                                />
                            </label>
                        </div>

                        <label className="block">
                            <span className="text-sm font-medium text-slate-300">Medical history</span>
                            <textarea
                                className="mt-2 min-h-24 w-full resize-y rounded-md border border-slate-700 bg-[#0f1417] px-3 py-3 text-white outline-none transition-colors focus:border-cyan-400"
                                value={patientDetails.history}
                                onChange={(e) => setPatientDetails({ ...patientDetails, history: e.target.value })}
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-slate-300">X-ray image</span>
                            <div className="mt-2 flex min-h-72 cursor-pointer items-center justify-center rounded-md border border-dashed border-slate-600 bg-[#10181c] p-4 transition-colors hover:border-cyan-400">
                                {imagePreview ? (
                                    <Image
                                        src={imagePreview}
                                        alt="Selected X-ray preview"
                                        width={640}
                                        height={360}
                                        unoptimized
                                        className="max-h-64 w-full object-contain"
                                    />
                                ) : (
                                    <div className="text-center">
                                        <p className="text-lg font-semibold text-slate-100">Select image</p>
                                        <p className="mt-1 text-sm text-slate-500">PNG, JPG, or JPEG</p>
                                    </div>
                                )}
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </div>
                        </label>

                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="h-12 w-full rounded-md bg-cyan-300 px-5 text-base font-bold text-slate-950 transition-colors hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                        >
                            {loading ? "Analyzing X-ray" : "Generate report"}
                        </button>
                    </form>
                </section>

                <aside className="space-y-6">
                    <section className="rounded-md border border-slate-800 bg-[#151d21] p-5 shadow-lg shadow-black/20">
                        <div className="border-b border-slate-800 pb-4">
                            <p className="text-sm font-medium uppercase tracking-[0.12em] text-emerald-300">Result</p>
                            <h2 className="mt-1 text-2xl font-semibold text-white">Current report</h2>
                        </div>

                        {error && (
                            <div className="mt-5 rounded-md border border-red-500/50 bg-red-950/40 p-4 text-sm font-medium text-red-200">
                                {error}
                            </div>
                        )}

                        {!prediction && !error && (
                            <div className="mt-5 rounded-md border border-slate-800 bg-[#10181c] p-5 text-slate-400">
                                No current diagnosis
                            </div>
                        )}

                        {prediction && (
                            <div className="mt-5 space-y-4">
                                <div className="rounded-md border border-emerald-500/40 bg-emerald-950/30 p-5">
                                    <p className="text-sm text-emerald-200">Predicted class</p>
                                    <p className="mt-2 text-3xl font-bold text-white">{prediction}</p>
                                </div>
                                {reportUrl && (
                                    <a
                                        href={reportUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex h-11 items-center justify-center rounded-md border border-cyan-400 text-sm font-bold text-cyan-200 transition-colors hover:bg-cyan-400 hover:text-slate-950"
                                    >
                                        Open PDF report
                                    </a>
                                )}
                            </div>
                        )}
                    </section>

                    <section className="rounded-md border border-slate-800 bg-[#151d21] p-5 shadow-lg shadow-black/20">
                        <div className="border-b border-slate-800 pb-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-medium uppercase tracking-[0.12em] text-cyan-300">RFID lookup</p>
                                    <h2 className="mt-1 text-2xl font-semibold text-white">Patient history</h2>
                                </div>
                                <div className="text-right text-xs text-slate-500">
                                    <p>{latestScan?.uid || "No UID"}</p>
                                    <p className="mt-1">{scanAge}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 flex gap-2">
                            <input
                                type="text"
                                className="min-w-0 flex-1 rounded-md border border-slate-700 bg-[#0f1417] px-3 font-mono text-white outline-none transition-colors focus:border-emerald-400"
                                value={lookupUid}
                                onChange={(e) => setLookupUid(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => loadReportsByUid(lookupUid)}
                                className="h-11 rounded-md bg-emerald-300 px-4 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-200"
                            >
                                Search
                            </button>
                        </div>

                        <p className="mt-3 text-sm text-slate-400">{lookupMessage}</p>

                        <div className="mt-5 divide-y divide-slate-800 overflow-hidden rounded-md border border-slate-800">
                            {!hasReports && (
                                <div className="bg-[#10181c] p-5 text-sm text-slate-500">
                                    No report history loaded
                                </div>
                            )}

                            {reports.map((report) => (
                                <article key={`${report.report_filename}-${report.created_at}`} className="bg-[#10181c] p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold text-white">{report.name || "Unknown patient"}</p>
                                            <p className="mt-1 text-sm text-slate-400">
                                                ID {report.patient_id || "N/A"} | UID {report.rfid_uid || "N/A"}
                                            </p>
                                        </div>
                                        <span className="rounded-md bg-slate-800 px-2 py-1 text-xs font-semibold text-emerald-200">
                                            {report.prediction}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                                        <p className="text-slate-500">{formatDate(report.created_at)}</p>
                                        <a
                                            href={report.report_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-semibold text-cyan-300 transition-colors hover:text-cyan-100"
                                        >
                                            Open PDF
                                        </a>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                </aside>
            </div>
        </main>
    );
}
