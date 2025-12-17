'use client';

import { useState, useRef, useEffect } from 'react';
import { MicrophoneIcon, StopIcon, TrashIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface AudioRecorderProps {
    onRecordingComplete: (file: File) => void;
    onCancel: () => void;
}

export default function AudioRecorder({ onRecordingComplete, onCancel }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [audioUrl]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
                const url = URL.createObjectURL(blob);
                setAudioBlob(blob);
                setAudioUrl(url);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setDuration(0);

            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Could not access microphone');
            onCancel();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSend = () => {
        if (audioBlob) {
            const file = new File([audioBlob], `voice_message_${Date.now()}.wav`, { type: 'audio/wav' });
            onRecordingComplete(file);
        }
    };

    const handleDiscard = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioBlob(null);
        setAudioUrl(null);
        setDuration(0);
        onCancel();
    };

    useEffect(() => {
        startRecording();
    }, []);

    return (
        <div className="flex items-center gap-3 w-full bg-gray-100 px-4 py-2 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex-1 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full bg-red-500 ${isRecording ? 'animate-pulse' : ''}`} />
                <span className="text-sm font-medium text-gray-700 tabular-nums">
                    {formatDuration(duration)}
                </span>

                {isRecording ? (
                    <div className="flex-1 h-8 flex items-center gap-0.5 px-4">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="w-1 bg-red-400 rounded-full"
                                style={{
                                    height: `${Math.random() * 100}%`,
                                    maxHeight: '24px'
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 px-4">
                        <audio src={audioUrl || ''} controls className="h-8 w-full" />
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={handleDiscard}
                    className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                    title="Discard"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>

                {isRecording ? (
                    <button
                        type="button"
                        onClick={stopRecording}
                        className="p-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors"
                        title="Stop"
                    >
                        <StopIcon className="w-5 h-5 fill-current" />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleSend}
                        className="p-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors"
                        title="Send Voice Message"
                    >
                        <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
}
