
import React, { useState, useRef } from 'react';
import { analyzeVideoFrames } from '../../services/aiService';
import { FileInput } from '../../components/common/FileInput';
import { PromptInput } from '../../components/common/PromptInput';
import { Spinner } from '../../components/Spinner';
import { useSettings } from '../../context/SettingsContext';

const extractFramesFromVideo = (
    videoFile: File,
    framesToExtract: number = 10
): Promise<{ data: string, mimeType: string }[]> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(videoFile);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const frames: { data: string, mimeType: string }[] = [];

        video.onloadeddata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const duration = video.duration;
            const interval = duration / framesToExtract;

            let framesExtracted = 0;
            const captureFrame = (time: number) => {
                video.currentTime = time;
            };

            video.onseeked = () => {
                if (!context) {
                    reject(new Error("Canvas context not available"));
                    return;
                }
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/jpeg');
                const data = dataUrl.split(',')[1];
                frames.push({ data, mimeType: 'image/jpeg' });
                framesExtracted++;

                if (framesExtracted < framesToExtract) {
                    captureFrame(framesExtracted * interval);
                } else {
                    URL.revokeObjectURL(video.src);
                    resolve(frames);
                }
            };
            
            captureFrame(0);
        };
        video.onerror = (e) => reject(e);
    });
};

export const VideoAnalyzer: React.FC = () => {
    const { settings } = useSettings();
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('Summarize this video.');
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = (file: File) => {
        setVideoFile(file);
        setVideoUrl(URL.createObjectURL(file));
        setAnalysis(null);
    };

    const handleSubmit = async () => {
        if (!videoFile || prompt.trim() === '') return;
        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            setStatus('Extracting frames...');
            const frames = await extractFramesFromVideo(videoFile);
            setStatus('Analyzing video...');
            const result = await analyzeVideoFrames(prompt, frames, settings);
            setAnalysis(result);
        } catch (err: any) {
            console.error('Video analysis failed:', err);
            setError(`Failed to analyze video: ${err.message}`);
        } finally {
            setIsLoading(false);
            setStatus('');
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-2">Video Analysis</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Upload a short video and ask a question about its content.</p>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                    {videoUrl ? (
                        <video src={videoUrl} controls className="max-w-full max-h-full rounded-lg" />
                    ) : (
                        <FileInput onFileSelect={handleFileSelect} accept="video/*" label="Upload Video" />
                    )}
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Spinner text={status} size="lg" />
                        </div>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : analysis ? (
                        <p className="whitespace-pre-wrap">{analysis}</p>
                    ) : (
                        <p className="text-gray-400">Analysis will appear here.</p>
                    )}
                </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <PromptInput
                    value={prompt}
                    onChange={setPrompt}
                    onSubmit={handleSubmit}
                    disabled={!videoFile || isLoading}
                    placeholder="e.g., What are the key moments in this clip?"
                />
            </div>
        </div>
    );
};
