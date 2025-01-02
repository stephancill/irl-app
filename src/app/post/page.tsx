"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Camera, RefreshCcw, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import Webcam from "react-webcam";
import { AuthError } from "../../lib/errors";

interface MediaDeviceInfo {
  deviceId: string;
  kind: string;
  label: string;
}

const dataURItoBlob = (dataURI: string) => {
  const byteString = atob(dataURI.split(",")[1]);
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

const imageDimensions = {
  width: 640 * 2,
  height: 852 * 2,
};

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [devices, setDevices] = React.useState<MediaDeviceInfo[]>();
  const [isBackCamera, setIsBackCamera] = React.useState(false);
  const [frontDevice, setFrontDevice] = React.useState<MediaDeviceInfo | null>(
    null
  );
  const [backDevice, setBackDevice] = React.useState<MediaDeviceInfo | null>(
    null
  );
  const webcamRef = React.useRef<Webcam>(null);
  const [frontImage, setFrontImage] = React.useState<string | null>(null);
  const [backImage, setBackImage] = React.useState<string | null>(null);
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [countdown, setCountdown] = React.useState(3);
  const [activeCamera, setActiveCamera] = React.useState<"front" | "back">(
    "front"
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const isCameraReady = React.useRef(false);
  const [initialSwitchComplete, setInitialSwitchComplete] =
    React.useState(false);

  const switchCamera = React.useCallback(() => {
    setIsLoading(true);

    // Stop all tracks of the current stream
    if (webcamRef.current?.video?.srcObject) {
      const stream = webcamRef.current.video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }

    // Add a small delay before switching cameras
    setTimeout(() => {
      const newCamera = activeCamera === "front" ? "back" : "front";
      setActiveCamera(newCamera);
      setIsBackCamera(newCamera === "back");

      // Reset camera ready state
      isCameraReady.current = false;
    }, 300); // 300ms delay
  }, [activeCamera]);

  // Double tap handler
  const lastTap = React.useRef(0);
  const handleDoubleTap = React.useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      switchCamera();
    }
    lastTap.current = now;
  }, [switchCamera]);

  const handleDevices = React.useCallback((mediaDevices: MediaDeviceInfo[]) => {
    const videoDevices = mediaDevices.filter(
      ({ kind }) => kind === "videoinput"
    );

    // Back devices, ordered alphabetically
    const backDevices = videoDevices
      .filter((device) => device.label.toLowerCase().includes("back"))
      .sort((a, b) => a.label.localeCompare(b.label));

    // Front devices, ordered alphabetically
    const frontDevices = videoDevices
      .filter((device) => device.label.toLowerCase().includes("front"))
      .sort((a, b) => a.label.localeCompare(b.label));

    setFrontDevice(frontDevices[0]);
    setBackDevice(backDevices[0]);

    setDevices(videoDevices);
  }, []);

  React.useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => navigator.mediaDevices.enumerateDevices())
      .then(handleDevices)
      .catch((error) => console.error("Error accessing camera:", error));
  }, [handleDevices]);

  const captureFromCamera = React.useCallback((isBack: boolean) => {
    const imageSrc = webcamRef.current?.getScreenshot(imageDimensions);
    if (imageSrc) {
      if (isBack) {
        setBackImage(imageSrc);
      } else {
        setFrontImage(imageSrc);
      }
    }
  }, []);

  const startDualCapture = React.useCallback(async () => {
    setIsCapturing(true);
    // First capture from current active camera
    captureFromCamera(activeCamera === "back");

    // Switch to opposite camera and wait for switch
    const nextCamera = activeCamera === "front" ? "back" : "front";
    setIsBackCamera(nextCamera === "back");

    // Reset camera ready state
    isCameraReady.current = false;

    // Wait for camera to be ready
    await new Promise((resolve) => {
      const checkReady = setInterval(() => {
        if (isCameraReady.current) {
          clearInterval(checkReady);
          resolve(true);
        }
      }, 100);
    });

    // Start countdown
    let count = 3;
    const countdownInterval = setInterval(() => {
      setCountdown(count - 1);
      count -= 1;
      if (count === 0) {
        clearInterval(countdownInterval);
        setTimeout(() => {
          captureFromCamera(nextCamera === "back");
          setIsCapturing(false);
          setCountdown(3);
          setIsBackCamera(activeCamera === "back");
        }, 1000);
      }
    }, 1000);
  }, [captureFromCamera, activeCamera]);

  // Called when the user media stream starts
  const handleUserMedia = React.useCallback((stream: MediaStream) => {
    // Store the stream in a ref for cleanup
    if (webcamRef.current?.video) {
      webcamRef.current.video.srcObject = stream;
    }

    const checkStream = () => {
      if (!webcamRef.current?.video) {
        setTimeout(checkStream, 100);
        return;
      }

      const attemptCapture = () => {
        try {
          const screenshot = webcamRef.current?.getScreenshot();
          if (screenshot) {
            setIsLoading(false);
            isCameraReady.current = true;
            return;
          }
          setTimeout(attemptCapture, 100);
        } catch (error) {
          console.error("Screenshot attempt failed:", error);
          setTimeout(attemptCapture, 100);
        }
      };

      attemptCapture();
    };

    checkStream();
  }, []);

  useEffect(() => {
    if (isCameraReady.current && !initialSwitchComplete) {
      switchCamera();
      setInitialSwitchComplete(true);
    }
  }, [isCameraReady.current, initialSwitchComplete]);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!frontImage || !backImage) {
        throw new Error("Front and back images are required");
      }

      // Get the signature from the server
      const signResponse = await fetch(
        `/api/generate-signature?primaryType=${activeCamera}`
      );

      if (!signResponse.ok) {
        if (signResponse.status === 401) {
          throw new AuthError("Failed to get signature");
        }
        throw new Error("Failed to get signature");
      }

      const responseData = await signResponse.json();

      async function uploadImage(image: string, cameraType: "front" | "back") {
        const signData = responseData[cameraType];

        const formData = new FormData();
        formData.append("file", dataURItoBlob(image));
        formData.append("api_key", responseData.apikey);
        formData.append("signature", signData.signature);

        for (const key in signData.params) {
          formData.append(key, signData.params[key]);
        }

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${responseData.cloudname}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image to Cloudinary");
        }
      }

      // Upload front and back images
      await Promise.all([
        uploadImage(frontImage, "front"),
        uploadImage(backImage, "back"),
      ]);

      // Poll for post completion with 5-second timeout
      const postId = responseData.postId;
      const startTime = Date.now();
      const TIMEOUT = 5000; // 5 seconds

      while (Date.now() - startTime < TIMEOUT) {
        const pollResponse = await fetch(`/api/posts/${postId}`);
        if (!pollResponse.ok) {
          throw new Error("Failed to check post status");
        }
        const postData = await pollResponse.json();

        if (postData.isReady) {
          return postId;
        }

        // Wait 1 second before next poll
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // If we reach here, we've timed out but we'll still return the postId
      return postId;
    },
    onSuccess: () => {
      router.push(searchParams.get("redirect") || "/");
    },
  });

  return (
    <div className="h-screen">
      <div className="fixed inset-0">
        <div className="relative h-full">
          {/* Preview section */}
          {(frontImage || backImage) && !isCapturing && (
            <div className="absolute inset-0 z-10">
              {/* Full screen active image */}
              <img
                src={(activeCamera === "front" ? frontImage : backImage) || ""}
                alt={`${activeCamera} capture`}
                className="w-full h-full object-cover"
              />

              {/* Thumbnail of inactive image */}
              {frontImage && backImage && (
                <button
                  onClick={switchCamera}
                  className="absolute top-16 right-4 z-20 bg-white/80 p-1 rounded-lg backdrop-blur-sm"
                >
                  <img
                    src={
                      activeCamera === "front" ? backImage : frontImage || ""
                    }
                    alt={`${
                      activeCamera === "front" ? "Back" : "Front"
                    } capture`}
                    className="w-24 rounded-md"
                  />
                </button>
              )}
            </div>
          )}

          {/* Camera view */}
          <div className="h-full">
            <h2 className="absolute top-4 left-0 right-0 text-center text-white z-10 text-xl font-semibold">
              irl
            </h2>
            <div className="relative h-full">
              {(!frontImage || !backImage) && (
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  mirrored={!isBackCamera}
                  screenshotFormat="image/png"
                  videoConstraints={{
                    deviceId: isBackCamera
                      ? backDevice?.deviceId
                      : frontDevice?.deviceId,
                    facingMode: isBackCamera ? "environment" : "user",
                  }}
                  className={`w-full h-full object-cover ${
                    isLoading ? "opacity-0" : "opacity-100"
                  }`}
                  width={imageDimensions.width}
                  height={imageDimensions.height}
                  onUserMedia={handleUserMedia}
                  onClick={handleDoubleTap}
                />
              )}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                    {devices === undefined ? (
                      <p>Waiting for camera permission...</p>
                    ) : (
                      devices.length === 0 && <p>No camera devices found</p>
                    )}
                  </div>
                </div>
              )}
              {isCapturing && isCameraReady.current && (
                <div className="fixed inset-0 flex items-center justify-center z-20">
                  <div className="bg-white/80 w-32 h-32 flex items-center justify-center text-6xl font-bold rounded-full backdrop-blur-sm">
                    {countdown + 1}
                  </div>
                </div>
              )}
              <div className="absolute bottom-8 right-0 left-0 flex justify-between px-4">
                {!isCapturing && !frontImage && !backImage && (
                  <>
                    <div className="w-14"></div>
                    <button
                      onClick={startDualCapture}
                      className="bg-white/80 p-4 rounded-full disabled:opacity-50 backdrop-blur-sm mx-auto"
                      disabled={!backDevice || !frontDevice || isLoading}
                      aria-label="Capture from both cameras"
                    >
                      <Camera className="w-6 h-6" />
                    </button>
                    <button
                      onClick={switchCamera}
                      className="bg-white/80 p-4 rounded-full disabled:opacity-50 backdrop-blur-sm"
                      disabled={!backDevice || !frontDevice || isLoading}
                      aria-label={`Switch to ${
                        activeCamera === "front" ? "Back" : "Front"
                      } Camera`}
                    >
                      <RefreshCcw className="w-6 h-6" />
                    </button>
                  </>
                )}
                {!isCapturing && frontImage && backImage && (
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 z-20">
                    <button
                      onClick={() => {
                        setFrontImage(null);
                        setBackImage(null);
                      }}
                      className="bg-white/80 p-4 rounded-full disabled:opacity-50 backdrop-blur-sm flex items-center gap-2"
                      aria-label="Retake photos"
                      disabled={uploadMutation.isPending}
                    >
                      <RotateCcw className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => uploadMutation.mutate()}
                      className="bg-white/80 p-4 rounded-full disabled:opacity-50 backdrop-blur-sm flex items-center gap-2"
                      disabled={uploadMutation.isPending}
                      aria-label="Proceed with photos"
                    >
                      {uploadMutation.isPending ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
                      ) : (
                        <ArrowRight className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Link href="/" className="fixed top-4 right-4 z-10" aria-label="Go back">
        <X className="w-6 h-6 text-white" />
      </Link>
    </div>
  );
}
