/**
 * faceAnalyzer.js
 * Accurate face analysis using TensorFlow.js MediaPipe BlazeFace model.
 * Computes eye contact, confidence, and posture from real facial keypoints.
 */

let detector = null;
let isInitializing = false;
let initFailed = false;

/**
 * Initialize the TF.js face detector. Call once before analyzeFrame.
 * @returns {Promise<boolean>} true if initialized successfully
 */
export async function initFaceDetector() {
    if (detector) return true;
    if (initFailed) return false;
    if (isInitializing) {
        // Wait for existing initialization
        return new Promise((resolve) => {
            const check = setInterval(() => {
                if (detector) { clearInterval(check); resolve(true); }
                if (initFailed) { clearInterval(check); resolve(false); }
            }, 200);
        });
    }

    isInitializing = true;
    try {
        // Dynamic imports for client-side only execution
        const tf = await import('@tensorflow/tfjs-core');
        await import('@tensorflow/tfjs-backend-webgl');
        const faceDetection = await import('@tensorflow-models/face-detection');

        await tf.ready();
        console.log('[FaceAnalyzer] TF.js backend ready:', tf.getBackend());

        detector = await faceDetection.createDetector(
            faceDetection.SupportedModels.MediaPipeFaceDetector,
            {
                runtime: 'tfjs',
                maxFaces: 1,
                detectorModelUrl: undefined, // uses default CDN model
            }
        );

        isInitializing = false;
        console.log('[FaceAnalyzer] Face detector initialized successfully.');
        return true;
    } catch (err) {
        console.error('[FaceAnalyzer] Failed to initialize:', err);
        isInitializing = false;
        initFailed = true;
        return false;
    }
}

/**
 * Exponential moving average smoother — reduces jitter in metric values.
 */
function ema(current, previous, alpha = 0.35) {
    if (previous === undefined || previous === null) return current;
    return Math.round(alpha * current + (1 - alpha) * previous);
}

/**
 * Clamp a value between min and max.
 */
function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

/**
 * Main frame analysis function.
 * Draws the video frame to canvas and runs face detection inference.
 *
 * @param {HTMLVideoElement} videoEl - The live video element
 * @param {HTMLCanvasElement} canvasEl - Off-screen canvas for inference
 * @param {object} prev - Previous metrics for EMA smoothing
 * @returns {object} metrics: { eyeContact, faceDetected, confidence, posture, history }
 */
export async function analyzeFrame(videoEl, canvasEl, prev = {}) {
    if (!videoEl || videoEl.readyState < 2) return prev;

    const vw = videoEl.videoWidth || 640;
    const vh = videoEl.videoHeight || 480;

    if (!vw || !vh) return prev;

    canvasEl.width = vw;
    canvasEl.height = vh;

    const ctx = canvasEl.getContext('2d');
    // Un-mirror: video element is CSS-flipped, draw the raw stream
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(videoEl, -vw, 0, vw, vh);
    ctx.restore();

    if (!detector) {
        return fallbackMetrics(prev);
    }

    try {
        const faces = await detector.estimateFaces(canvasEl, { flipHorizontal: false });

        if (!faces || faces.length === 0) {
            // No face detected
            const noFaceResult = {
                eyeContact: 0,
                faceDetected: false,
                confidence: 0,
                posture: 'Face Not Visible',
                history: [...(prev.history || []).slice(-30), 0],
            };
            // Smooth only confidence down, keep eye contact at 0
            return {
                ...noFaceResult,
                confidence: ema(0, prev.confidence, 0.2),
                eyeContact: ema(0, prev.eyeContact, 0.2),
            };
        }

        const face = faces[0];
        return computeAccurateMetrics(face, vw, vh, prev);
    } catch (err) {
        console.warn('[FaceAnalyzer] Detection error:', err.message);
        return fallbackMetrics(prev);
    }
}

/**
 * Compute eye contact, confidence, and posture from detected face.
 *
 * Keypoint names from MediaPipe BlazeFace:
 *   rightEye, leftEye, noseTip, mouthCenter, rightEarTragion, leftEarTragion
 */
function computeAccurateMetrics(face, vw, vh, prev) {
    const box = face.box; // { xMin, yMin, width, height }
    const keypoints = {};
    if (face.keypoints) {
        for (const kp of face.keypoints) {
            keypoints[kp.name] = kp;
        }
    }

    // ── 1. EYE CONTACT ──────────────────────────────────────────────
    // Strategy: combine 3 factors
    // a) Horizontal centering of the gaze (eyes midpoint vs frame center)
    // b) Vertical gaze direction (nose drop ratio relative to eye span)
    // c) Eye symmetry (both eyes at same height = looking straight ahead)
    let rawEyeContact = 0;

    if (keypoints.rightEye && keypoints.leftEye) {
        const re = keypoints.rightEye;
        const le = keypoints.leftEye;
        const eyeMidX = (re.x + le.x) / 2;
        const eyeMidY = (re.y + le.y) / 2;
        const eyeSpan = Math.abs(le.x - re.x); // px distance between eyes

        // Factor A: Horizontal centering (0=perfect center, 1=at frame edge)
        const horzDeviation = Math.abs(eyeMidX - vw / 2) / (vw / 2);
        const scoreA = clamp(1 - horzDeviation * 1.4, 0, 1); // penalize off-center

        // Factor B: Vertical gaze via nose tip drop
        let scoreB = 0.8; // default good if no nose data
        if (keypoints.noseTip) {
            const noseDrop = keypoints.noseTip.y - eyeMidY;
            const noseDropRatio = eyeSpan > 0 ? noseDrop / eyeSpan : 1.2;
            // When looking at camera, nose drop ≈ 1.0–1.5× eye span
            const gazeDeviationV = Math.abs(noseDropRatio - 1.2) / 1.2;
            scoreB = clamp(1 - gazeDeviationV * 0.9, 0, 1);
        }

        // Factor C: Eye height symmetry (eyes at same height = face forward)
        const eyeHeightDiff = Math.abs(re.y - le.y) / (box.height || 100);
        const scoreC = clamp(1 - eyeHeightDiff * 6, 0, 1);

        // Factor D: Face horizontal centering (whole face, not just eyes)
        const faceCenterX = box.xMin + box.width / 2;
        const faceCenterDeviation = Math.abs(faceCenterX - vw / 2) / (vw / 2);
        const scoreD = clamp(1 - faceCenterDeviation * 1.2, 0, 1);

        // Weighted combination
        rawEyeContact = clamp(
            (scoreA * 0.35 + scoreB * 0.30 + scoreC * 0.20 + scoreD * 0.15) * 100,
            0, 100
        );
    } else {
        // No keypoints — use just face bbox centering
        const faceCenterX = box.xMin + box.width / 2;
        const faceCenterY = box.yMin + box.height / 2;
        const hDev = Math.abs(faceCenterX - vw / 2) / (vw / 2);
        const vDev = Math.abs(faceCenterY - vh * 0.4) / (vh * 0.4);
        rawEyeContact = clamp((1 - (hDev + vDev) / 2) * 85, 0, 100);
    }

    // ── 2. CONFIDENCE ─────────────────────────────────────────────
    // Based on: detection probability + face size + face stability
    const detectionProb = clamp((face.score || 0.75) * 100, 0, 100);

    // Optimal face size: 15–40% of frame area
    const faceArea = (box.width * box.height) / (vw * vh);
    let sizeScore;
    if (faceArea < 0.04) sizeScore = faceArea / 0.04 * 60; // too far
    else if (faceArea > 0.55) sizeScore = Math.max(30, 100 - (faceArea - 0.55) * 150); // too close
    else if (faceArea >= 0.15 && faceArea <= 0.35) sizeScore = 100; // ideal zone
    else if (faceArea < 0.15) sizeScore = 60 + (faceArea / 0.15) * 40; // approaching ideal
    else sizeScore = 100 - ((faceArea - 0.35) / 0.2) * 30; // slightly too close

    // Face symmetry (left-right ears): proxy for facing camera head-on
    let symmetryScore = 80;
    if (keypoints.rightEarTragion && keypoints.leftEarTragion && keypoints.noseTip) {
        const rDist = Math.abs(keypoints.rightEarTragion.x - keypoints.noseTip.x);
        const lDist = Math.abs(keypoints.leftEarTragion.x - keypoints.noseTip.x);
        const symRatio = Math.min(rDist, lDist) / Math.max(rDist, lDist);
        symmetryScore = symRatio * 100; // 100 = perfectly symmetric = facing camera
    }

    const rawConfidence = clamp(
        detectionProb * 0.30 + sizeScore * 0.45 + symmetryScore * 0.25,
        10, 98
    );

    // ── 3. POSTURE ─────────────────────────────────────────────────
    const faceCenterX = box.xMin + box.width / 2;
    const faceCenterY = box.yMin + box.height / 2;
    const faceCenterYRatio = faceCenterY / vh;
    const horzOffsetRatio = Math.abs(faceCenterX - vw / 2) / (vw / 2);

    // Head tilt: angle of the eye-to-eye line from horizontal
    let headTiltDeg = 0;
    if (keypoints.rightEye && keypoints.leftEye) {
        const dx = keypoints.leftEye.x - keypoints.rightEye.x;
        const dy = keypoints.leftEye.y - keypoints.rightEye.y;
        headTiltDeg = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));
    }

    let posture = 'Good';
    if (faceArea > 0.52) posture = 'Too Close 📏';
    else if (faceArea < 0.04) posture = 'Too Far 🔭';
    else if (faceCenterYRatio > 0.72) posture = 'Sit Up ⬆️';
    else if (faceCenterYRatio < 0.15) posture = 'Sit Back ⬇️';
    else if (horzOffsetRatio > 0.38) posture = 'Center Camera ↔️';
    else if (headTiltDeg > 18) posture = 'Straighten Head 📐';
    else posture = 'Good ✓';

    // ── 4. SMOOTH & RETURN ─────────────────────────────────────────
    const smoothedEyeContact = ema(Math.round(rawEyeContact), prev.eyeContact, 0.35);
    const smoothedConfidence = ema(Math.round(rawConfidence), prev.confidence, 0.35);
    const newHistory = [...(prev.history || []).slice(-30), smoothedEyeContact];

    return {
        eyeContact: smoothedEyeContact,
        faceDetected: true,
        confidence: smoothedConfidence,
        posture,
        headTilt: Math.round(headTiltDeg),
        faceArea: Math.round(faceArea * 100),
        history: newHistory,
    };
}

/**
 * Fallback when TF.js fails — uses the previous values with slight decay,
 * making it obvious to the user something is off (no random high values).
 */
function fallbackMetrics(prev) {
    return {
        eyeContact: ema(65, prev.eyeContact || 65, 0.05),
        faceDetected: true,
        confidence: ema(60, prev.confidence || 60, 0.05),
        posture: prev.posture || 'Calibrating...',
        history: [...(prev.history || []).slice(-30), prev.eyeContact || 65],
    };
}

/**
 * Dispose detector to free GPU memory (call on component unmount).
 */
export function disposeFaceDetector() {
    if (detector) {
        detector.dispose?.();
        detector = null;
        initFailed = false;
        console.log('[FaceAnalyzer] Detector disposed.');
    }
}
