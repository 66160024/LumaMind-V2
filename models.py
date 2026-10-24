from datetime import datetime

from extensions import db


# =========================
# USER
# =========================

class User(db.Model):

    user_id = db.Column(
        db.Integer,
        primary_key=True
    )

    username = db.Column(
        db.String(80),
        unique=True,
        nullable=False
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False
    )

    password = db.Column(
        db.String(255),
        nullable=False
    )


# =========================
# CHAT SESSION
# =========================

class ChatSession(db.Model):

    session_id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.user_id"),
        nullable=False
    )

    title = db.Column(
        db.String(150),
        nullable=False,
        default="บทสนทนาใหม่"
    )

    mood = db.Column(
        db.String(20),
        nullable=True
    )

    start_time = db.Column(
        db.DateTime,
        default=datetime.now
    )


# =========================
# CHAT MESSAGE
# =========================

class ChatMessage(db.Model):

    message_id = db.Column(
        db.Integer,
        primary_key=True
    )

    session_id = db.Column(
        db.Integer,
        db.ForeignKey("chat_session.session_id"),
        nullable=False
    )

    sender = db.Column(
        db.String(20),
        nullable=False
    )

    message_text = db.Column(
        db.Text,
        nullable=False
    )

    timestamp = db.Column(
        db.DateTime,
        default=datetime.now
    )


# =========================
# FEELING ENTRY
# =========================

class FeelingEntry(db.Model):

    feeling_id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.user_id"),
        nullable=False
    )

    feeling_text = db.Column(
        db.Text,
        nullable=False
    )

    mood = db.Column(
        db.String(20),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.now
    )


# =========================
# SATISFACTION SURVEY
# =========================

class SatisfactionSurvey(db.Model):

    survey_id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.user_id"),
        nullable=False
    )

    session_id = db.Column(
        db.Integer,
        db.ForeignKey("chat_session.session_id"),
        nullable=True
    )

    rating = db.Column(
        db.Integer,
        nullable=False
    )

    comment = db.Column(
        db.Text,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.now
    )