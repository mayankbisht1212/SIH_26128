from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import tensorflow as tf
import numpy as np
import io

app = FastAPI(
    title="Livestock Disease Detection API",
    version="1.0"
)

# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# MODEL
# =========================

MODEL_PATH = "best_livestock_model.keras"

model = tf.keras.models.load_model(MODEL_PATH)

CLASS_NAMES = [
    "Healthy",
    "Lumpy_Skin",
    "Other_Infections"
]

IMG_SIZE = (224, 224)


# =========================
# HOME
# =========================

@app.get("/")
def home():
    return {
        "status": "online",
        "model": "EfficientNetB0",
        "classes": CLASS_NAMES
    }


# =========================
# HEALTH CHECK
# =========================

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# =========================
# PREDICT
# =========================

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    audio: UploadFile = File(...)
):

    # =========================
    # VALIDATE IMAGE
    # =========================

    if (
        not file.content_type
        or not file.content_type.startswith("image/")
    ):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image."
        )

    # =========================
    # VALIDATE AUDIO
    # =========================

    if (
        not audio.content_type
        or not audio.content_type.startswith("audio/")
    ):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid audio file."
        )

    try:

        # =========================
        # READ IMAGE
        # =========================

        image_bytes = await file.read()

        image = Image.open(
            io.BytesIO(image_bytes)
        ).convert("RGB")

        # Resize image
        image = image.resize(IMG_SIZE)

        # Convert to NumPy array
        image_array = np.array(image)

        # Add batch dimension
        image_array = np.expand_dims(
            image_array,
            axis=0
        )

        # =========================
        # MODEL PREDICTION
        # =========================

        predictions = model.predict(
            image_array,
            verbose=0
        )[0]

        predicted_index = int(
            np.argmax(predictions)
        )

        predicted_class = CLASS_NAMES[
            predicted_index
        ]

        confidence = float(
            predictions[predicted_index]
        )

        probabilities = {
            CLASS_NAMES[i]: float(predictions[i])
            for i in range(len(CLASS_NAMES))
        }

        # =========================
        # READ AUDIO
        # =========================

        audio_bytes = await audio.read()

        # Currently we are only receiving
        # and validating the audio.
        #
        # Later you can send audio_bytes
        # to Whisper / another speech-to-text
        # model.

        # =========================
        # RESPONSE
        # =========================

        return {
            "success": True,

            "disease": predicted_class,

            "confidence": confidence,

            "confidence_percent": round(
                confidence * 100,
                2
            ),

            "probabilities": probabilities,

            "audio": {
                "received": True,
                "filename": audio.filename,
                "content_type": audio.content_type,
                "size_bytes": len(audio_bytes)
            }
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )