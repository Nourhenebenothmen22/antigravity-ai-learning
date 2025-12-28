import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
        required: true
    },
    questions: [{
        question: {
            type: String,
            required: true
        },
        options: [{
            option: {
                type: String,
                required: true
            },
            isCorrect: {
                type: Boolean,
                required: true,
                default: false
            }
        }],
        correctAnswer: {
            type: String,
            required: true
        },
        explanation: {
            type: String,
            required: false
        },
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            required: true,
            default: "medium"
        }
    }],
    userAnswers: [{
        questionIndex: {
            type: Number,
            required: true
        },
        selectedAnswer: {
            type: String,
            required: true
        },
        isCorrect: {
            type: Boolean,
            required: true
        }
    }],
    score: {
        type: Number,
        default: 0
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    answerAttempts: {
        type: Number,
        default: 0
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;