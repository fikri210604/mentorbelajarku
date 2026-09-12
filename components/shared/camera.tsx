'use client';

import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Camera as CameraIcon, RefreshCw, Check, X, FlipHorizontal } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  onCancel?: () => void;
  initialImage?: string | null;
  className?: string;
}

const videoConstraints: MediaTrackConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  facingMode: 'user',
};

export function CameraCapture({ onCapture, onCancel, initialImage, className }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(initialImage || null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot({
        width: 1024,
        height: 768,
      });
      if (imageSrc) {
        setCapturedImage(imageSrc);
        setCameraError(null);
      } else {
        setCameraError('Gagal mengambil gambar dari webcam. Coba lagi.');
      }
    }
  }, [webcamRef]);

  const retake = () => {
    setCapturedImage(null);
  };

  const confirmCapture = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className={`flex flex-col items-center gap-4 w-full max-w-md mx-auto p-4 bg-card rounded-lg border shadow-sm ${className || ''}`}>
      <div className="relative w-full aspect-4/3 bg-muted rounded-md overflow-hidden flex items-center justify-center">
        {capturedImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={capturedImage}
            alt="Hasil Foto Absensi"
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.85}
            videoConstraints={{ ...videoConstraints, facingMode }}
            onUserMediaError={(err) => {
              setCameraError('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di browser.');
              console.error('Webcam access error:', err);
            }}
            className="w-full h-full object-cover"
          />
        )}

        {!capturedImage && (
          <button
            type="button"
            onClick={toggleFacingMode}
            className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur rounded-full hover:bg-background transition shadow-sm text-foreground"
            title="Ganti Kamera Depan/Belakang"
          >
            <FlipHorizontal className="size-4" />
          </button>
        )}
      </div>

      {cameraError && (
        <Alert variant="destructive" className="w-full">
          <AlertDescription className="text-xs">{cameraError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between w-full gap-2 pt-2">
        {capturedImage ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={retake}
              className="flex-1 gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              Ambil Ulang
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={confirmCapture}
              className="flex-1 gap-1.5"
            >
              <Check className="size-3.5" />
              Gunakan Foto
            </Button>
          </>
        ) : (
          <>
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="gap-1"
              >
                <X className="size-3.5" />
                Batal
              </Button>
            )}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={capture}
              className="flex-1 gap-1.5"
            >
              <CameraIcon className="size-3.5" />
              Ambil Foto
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// Alias for common naming
export const Camera = CameraCapture;
