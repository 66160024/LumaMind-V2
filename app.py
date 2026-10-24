from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    flash,
    session
)

import requests
from datetime import datetime, timedelta
from collections import Counter
from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)

from flask_wtf.csrf import CSRFProtect
from extensions import db

from models import (
    User,
    ChatSession,
    ChatMessage,
    FeelingEntry,
    SatisfactionSurvey
)


# =========================
# CREATE APP
# =========================

app = Flask(__name__)


# =========================
# CONFIG
# =========================

app.config["SECRET_KEY"] = "lumamind-secret-key"

app.config["SQLALCHEMY_DATABASE_URI"] = (
    "sqlite:///lumamind.db"
)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

csrf = CSRFProtect(app)
# =========================
# DATABASE
# =========================

db.init_app(app)


# =========================
# HOME
# =========================

@app.route("/")
def home():

    if "user_id" not in session:
        return redirect(
            url_for("login")
        )

    chat_sessions = (
        ChatSession.query
        .join(
            ChatMessage,
            ChatMessage.session_id
            == ChatSession.session_id
        )
        .filter(
            ChatSession.user_id
            == session["user_id"]
        )
        .group_by(
            ChatSession.session_id
        )
        .order_by(
            ChatSession.start_time.desc()
        )
        .all()
    )

    chat_id = request.args.get(
        "chat_id",
        type=int
    )

    current_chat = None
    messages = []

    if chat_id:

        current_chat = (
            ChatSession.query
            .filter_by(
                session_id=chat_id,
                user_id=session["user_id"]
            )
            .first()
        )

        if current_chat:

            messages = (
                ChatMessage.query
                .filter_by(
                    session_id=current_chat.session_id
                )
                .order_by(
                    ChatMessage.timestamp.asc()
                )
                .all()
            )

    return render_template(
        "index.html",
        username=session["username"],
        chat_sessions=chat_sessions,
        current_chat=current_chat,
        messages=messages
    )
# =========================
# FEELING DASHBOARD
# =========================

@app.route("/dashboard")
def dashboard():

    if "user_id" not in session:
        return redirect(
            url_for("login")
        )

    user_id = session["user_id"]

    # =====================================
    # GET ALL FEELING ENTRIES
    # =====================================

    all_feelings = (
        FeelingEntry.query
        .filter_by(user_id=user_id)
        .order_by(FeelingEntry.created_at.desc())
        .all()
    )

    total_entries = len(all_feelings)

    # =====================================
    # LAST 7 DAYS
    # =====================================

    today = datetime.now().date()
    start_date = today - timedelta(days=6)

    weekly_feelings = [
        feeling
        for feeling in all_feelings
        if feeling.created_at
        and feeling.created_at.date() >= start_date
        and feeling.created_at.date() <= today
    ]

    weekly_count = len(weekly_feelings)

    # =====================================
    # MOOD CONFIG
    # =====================================

    mood_info = {
        "good": {
            "label": "ดีมาก",
            "emoji": "😊"
        },
        "calm": {
            "label": "ดี",
            "emoji": "😌"
        },
        "neutral": {
            "label": "เฉย ๆ",
            "emoji": "😐"
        },
        "anxious": {
            "label": "กังวล",
            "emoji": "😟"
        },
        "sad": {
            "label": "เศร้า",
            "emoji": "😔"
        }
    }

    # =====================================
    # MOST COMMON MOOD
    # =====================================

    weekly_moods = [
        feeling.mood
        for feeling in weekly_feelings
        if feeling.mood in mood_info
    ]

    if weekly_moods:

        mood_counter = Counter(weekly_moods)

        most_common_mood = (
            mood_counter
            .most_common(1)[0][0]
        )

        most_common = {
            "mood": most_common_mood,
            "label": mood_info[most_common_mood]["label"],
            "emoji": mood_info[most_common_mood]["emoji"]
        }

    else:

        most_common = {
            "mood": None,
            "label": "ยังไม่มีข้อมูล",
            "emoji": "–"
        }

    # =====================================
    # MOOD DISTRIBUTION
    # =====================================

    mood_counts = dict.fromkeys(mood_info, 0)

    for feeling in weekly_feelings:

        if feeling.mood in mood_counts:
            mood_counts[feeling.mood] += 1

    # =====================================
    # DAILY MOOD - LAST 7 DAYS
    # =====================================

    thai_days = [
        "จ.",
        "อ.",
        "พ.",
        "พฤ.",
        "ศ.",
        "ส.",
        "อา."
    ]

    week_data = []

    for day_offset in range(7):

        current_date = start_date + timedelta(
            days=day_offset
        )

        day_feelings = [
            feeling
            for feeling in weekly_feelings
            if feeling.created_at.date() == current_date
        ]

        # ใช้อารมณ์ล่าสุดของวันนั้น
        if day_feelings:

            latest_feeling = max(
                day_feelings,
                key=lambda feeling: feeling.created_at
            )

            mood = latest_feeling.mood

        else:
            mood = None

        week_data.append({
            "date": current_date.strftime("%d/%m"),
            "day": thai_days[current_date.weekday()],
            "mood": mood,
            "label": (
                mood_info[mood]["label"]
                if mood in mood_info
                else None
            ),
            "emoji": (
                mood_info[mood]["emoji"]
                if mood in mood_info
                else "–"
            )
        })

    # =====================================
    # RECENT ENTRIES
    # =====================================

    recent_entries = []

    for feeling in all_feelings[:5]:

        mood = feeling.mood

        recent_entries.append({
            "feeling_id": feeling.feeling_id,
            "text": feeling.feeling_text,
            "mood": mood,
            "label": (
                mood_info[mood]["label"]
                if mood in mood_info
                else "ไม่ได้ระบุ"
            ),
            "emoji": (
                mood_info[mood]["emoji"]
                if mood in mood_info
                else "–"
            ),
            "created_at": (
                feeling.created_at.strftime(
                    "%d/%m/%Y %H:%M"
                )
                if feeling.created_at
                else ""
            )
        })

    # =====================================
    # SEND DATA TO DASHBOARD
    # =====================================

    return render_template(
        "dashboard.html",

        username=session["username"],

        total_entries=total_entries,
        weekly_count=weekly_count,

        most_common=most_common,

        mood_counts=mood_counts,
        mood_info=mood_info,

        week_data=week_data,

        recent_entries=recent_entries
    )

# =========================
# NEW CHAT
# =========================

@app.route("/new-chat")
def new_chat():

    if "user_id" not in session:
        return redirect(
            url_for("login")
        )

    return redirect(
        url_for("home")
    )


# =========================
# SEND MESSAGE
# =========================

@app.route(
    "/send-message",
    methods=["POST"]
)
def send_message():

    if "user_id" not in session:

        return {
            "success": False,
            "error": "กรุณาเข้าสู่ระบบ"
        }, 401

    data = request.get_json()

    if not data:

        return {
            "success": False,
            "error": "ไม่พบข้อมูล"
        }, 400

    message_text = (
        data
        .get("message", "")
        .strip()
    )

    chat_id = data.get("chat_id")

    if not message_text:

        return {
            "success": False,
            "error": "ข้อความว่าง"
        }, 400

    # =========================
    # CREATE OR LOAD CHAT
    # =========================

    if not chat_id:

        chat = ChatSession(
            user_id=session["user_id"],
            title=message_text[:40]
        )

        db.session.add(chat)
        db.session.commit()

        chat_id = chat.session_id

    else:

        chat = (
            ChatSession.query
            .filter_by(
                session_id=chat_id,
                user_id=session["user_id"]
            )
            .first()
        )

        if chat is None:

            return {
                "success": False,
                "error": "ไม่พบบทสนทนา"
            }, 404

    # =========================
    # AI ANSWER
    #
    # Flask -> FastAPI
    # FastAPI -> RAG -> Qwen
    # =========================

    try:

        api_response = requests.post(
            "http://127.0.0.1:8000/chat",
            json={
                "message": message_text
            },
            timeout=180
        )

        api_response.raise_for_status()

        api_data = api_response.json()

        bot_text = api_data.get(
            "response"
        )

        if not bot_text:

            raise ValueError(
                "FastAPI ไม่ได้ส่ง response กลับมา"
            )

        print(
            "AI source: Qwen via FastAPI"
        )

    except requests.exceptions.RequestException as error:

        print(
            "FastAPI connection error:",
            error
        )

        return {
            "success": False,
            "error":
                "ระบบ AI ยังไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง"
        }, 503

    except Exception as error:

        print(
            "AI error:",
            error
        )

        return {
            "success": False,
            "error":
                "เกิดข้อผิดพลาดในการประมวลผลคำตอบ"
        }, 500

    # =========================
    # SAVE USER MESSAGE
    # =========================

    user_message = ChatMessage(
        session_id=chat_id,
        sender="user",
        message_text=message_text
    )

    db.session.add(
        user_message
    )

    # =========================
    # SAVE AI MESSAGE
    # =========================

    bot_message = ChatMessage(
        session_id=chat_id,
        sender="bot",
        message_text=bot_text
    )

    db.session.add(
        bot_message
    )

    db.session.commit()

    return {
        "success": True,
        "chat_id": chat_id,
        "bot_message": bot_text
    }


# =========================
# SAVE MOOD
# =========================

@app.route(
    "/save-mood",
    methods=["POST"]
)
def save_mood():

    if "user_id" not in session:

        return {
            "success": False,
            "error": "กรุณาเข้าสู่ระบบ"
        }, 401

    data = request.get_json()

    if not data:

        return {
            "success": False,
            "error": "ไม่พบข้อมูล"
        }, 400

    chat_id = data.get("chat_id")
    mood = data.get("mood")

    allowed_moods = [
        "good",
        "calm",
        "neutral",
        "sad",
        "anxious"
    ]

    if mood not in allowed_moods:

        return {
            "success": False,
            "error": "Mood ไม่ถูกต้อง"
        }, 400

    if not chat_id:

        return {
            "success": True,
            "saved": False
        }

    chat = (
        ChatSession.query
        .filter_by(
            session_id=chat_id,
            user_id=session["user_id"]
        )
        .first()
    )

    if chat is None:

        return {
            "success": False,
            "error": "ไม่พบบทสนทนา"
        }, 404

    chat.mood = mood

    db.session.commit()

    return {
        "success": True,
        "saved": True,
        "mood": chat.mood
    }


# =========================
# SAVE FEELING
# =========================

@app.route(
    "/save-feeling",
    methods=["POST"]
)
def save_feeling():

    if "user_id" not in session:

        return {
            "success": False,
            "error": "กรุณาเข้าสู่ระบบ"
        }, 401

    data = request.get_json()

    if not data:

        return {
            "success": False,
            "error": "ไม่พบข้อมูล"
        }, 400

    feeling_text = (
        data
        .get(
            "feeling_text",
            ""
        )
        .strip()
    )

    mood = data.get("mood")

    allowed_moods = [
        "good",
        "calm",
        "neutral",
        "sad",
        "anxious"
    ]

    if not feeling_text:

        return {
            "success": False,
            "error":
                "กรุณาเขียนความรู้สึกก่อนบันทึก"
        }, 400

    if (
        mood
        and mood not in allowed_moods
    ):

        return {
            "success": False,
            "error": "Mood ไม่ถูกต้อง"
        }, 400

    feeling = FeelingEntry(
        user_id=session["user_id"],
        feeling_text=feeling_text,
        mood=mood
    )

    db.session.add(
        feeling
    )

    db.session.commit()

    return {
        "success": True,
        "message":
            "เก็บความรู้สึกเรียบร้อยแล้ว 🌿",
        "feeling_id":
            feeling.feeling_id
    }


# =========================
# GET FEELING HISTORY
# =========================

@app.route(
    "/feeling-history",
    methods=["GET"]
)
def feeling_history():

    if "user_id" not in session:

        return {
            "success": False,
            "error": "กรุณาเข้าสู่ระบบ"
        }, 401

    feelings = (
        FeelingEntry.query
        .filter_by(
            user_id=session["user_id"]
        )
        .order_by(
            FeelingEntry.created_at.desc()
        )
        .all()
    )

    feeling_list = []

    for feeling in feelings:

        feeling_list.append({
            "feeling_id":
                feeling.feeling_id,

            "feeling_text":
                feeling.feeling_text,

            "mood":
                feeling.mood,

            "created_at":
                feeling.created_at.strftime(
                    "%d/%m/%Y %H:%M"
                )
        })

    return {
        "success": True,
        "feelings": feeling_list
    }


# =========================
# DELETE FEELING
# =========================

@app.route(
    "/delete-feeling/<int:feeling_id>",
    methods=["DELETE"]
)
def delete_feeling(feeling_id):

    if "user_id" not in session:

        return {
            "success": False,
            "error": "กรุณาเข้าสู่ระบบ"
        }, 401

    feeling = (
        FeelingEntry.query
        .filter_by(
            feeling_id=feeling_id,
            user_id=session["user_id"]
        )
        .first()
    )

    if feeling is None:

        return {
            "success": False,
            "error":
                "ไม่พบบันทึกที่ต้องการลบ"
        }, 404

    db.session.delete(
        feeling
    )

    db.session.commit()

    return {
        "success": True,
        "message":
            "ลบบันทึกเรียบร้อยแล้ว"
    }


# =========================
# SAVE SATISFACTION SURVEY
# =========================

@app.route(
    "/save-survey",
    methods=["POST"]
)
def save_survey():

    if "user_id" not in session:

        return {
            "success": False,
            "error": "กรุณาเข้าสู่ระบบ"
        }, 401

    data = request.get_json()

    if not data:

        return {
            "success": False,
            "error": "ไม่พบข้อมูล"
        }, 400

    rating = data.get("rating")

    comment = (
        data
        .get("comment", "")
        .strip()
    )

    chat_id = data.get("chat_id")

    try:
        rating = int(rating)

    except (
        TypeError,
        ValueError
    ):

        return {
            "success": False,
            "error":
                "คะแนนไม่ถูกต้อง"
        }, 400

    if rating < 1 or rating > 5:

        return {
            "success": False,
            "error":
                "คะแนนต้องอยู่ระหว่าง 1 ถึง 5"
        }, 400

    if len(comment) > 500:

        return {
            "success": False,
            "error":
                "ความคิดเห็นต้องไม่เกิน 500 ตัวอักษร"
        }, 400

    survey_chat_id = None

    if chat_id:

        try:
            chat_id = int(chat_id)

        except (
            TypeError,
            ValueError
        ):

            return {
                "success": False,
                "error":
                    "ข้อมูลบทสนทนาไม่ถูกต้อง"
            }, 400

        chat = (
            ChatSession.query
            .filter_by(
                session_id=chat_id,
                user_id=session["user_id"]
            )
            .first()
        )

        if chat is None:

            return {
                "success": False,
                "error":
                    "ไม่พบบทสนทนานี้"
            }, 404

        survey_chat_id = (
            chat.session_id
        )

    survey = SatisfactionSurvey(
        user_id=session["user_id"],
        session_id=survey_chat_id,
        rating=rating,
        comment=comment or None
    )

    db.session.add(
        survey
    )

    db.session.commit()

    return {
        "success": True,
        "message":
            "ขอบคุณสำหรับแบบประเมินค่ะ 💚",
        "survey_id":
            survey.survey_id
    }


# =========================
# DELETE CHAT
# =========================

@app.route(
    "/delete-chat/<int:chat_id>",
    methods=["POST"]
)
def delete_chat(chat_id):

    if "user_id" not in session:

        return redirect(
            url_for("login")
        )

    chat = (
        ChatSession.query
        .filter_by(
            session_id=chat_id,
            user_id=session["user_id"]
        )
        .first()
    )

    if chat is None:

        flash(
            "ไม่พบบทสนทนาที่ต้องการลบ"
        )

        return redirect(
            url_for("home")
        )

    SatisfactionSurvey.query.filter_by(
        session_id=chat.session_id
    ).update({
        "session_id": None
    })

    ChatMessage.query.filter_by(
        session_id=chat.session_id
    ).delete()

    db.session.delete(
        chat
    )

    db.session.commit()

    return redirect(
        url_for("home")
    )


# =========================
# REGISTER
# =========================

@app.route(
    "/register",
    methods=["GET", "POST"]
)
def register():

    if request.method == "POST":

        username = (
            request
            .form["username"]
            .strip()
        )

        email = (
            request
            .form["email"]
            .strip()
            .lower()
        )

        password = (
            request
            .form["password"]
        )

        existing_username = (
            User.query
            .filter_by(
                username=username
            )
            .first()
        )

        if existing_username:

            flash(
                "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว"
            )

            return redirect(
                url_for("register")
            )

        existing_email = (
            User.query
            .filter_by(
                email=email
            )
            .first()
        )

        if existing_email:

            flash(
                "อีเมลนี้ถูกสมัครสมาชิกแล้ว"
            )

            return redirect(
                url_for("register")
            )

        hashed_password = (
            generate_password_hash(
                password
            )
        )

        new_user = User(
            username=username,
            email=email,
            password=hashed_password
        )

        db.session.add(
            new_user
        )

        db.session.commit()

        flash(
            "สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ"
        )

        return redirect(
            url_for("login")
        )

    return render_template(
        "register.html"
    )


# =========================
# LOGIN
# =========================

@app.route(
    "/login",
    methods=["GET", "POST"]
)
def login():

    if request.method == "POST":

        email = (
            request
            .form["email"]
            .strip()
            .lower()
        )

        password = (
            request
            .form["password"]
        )

        user = (
            User.query
            .filter_by(
                email=email
            )
            .first()
        )

        if user is None:

            flash(
                "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
            )

            return redirect(
                url_for("login")
            )

        if not check_password_hash(
            user.password,
            password
        ):

            flash(
                "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
            )

            return redirect(
                url_for("login")
            )

        session["user_id"] = (
            user.user_id
        )

        session["username"] = (
            user.username
        )

        return redirect(
            url_for("home")
        )

    return render_template(
        "login.html"
    )


# =========================
# LOGOUT
# =========================

@app.route("/logout")
def logout():

    session.clear()

    flash(
        "ออกจากระบบเรียบร้อยแล้ว"
    )

    return redirect(
        url_for("login")
    )


# =========================
# RUN
# =========================

if __name__ == "__main__":

    with app.app_context():

        db.create_all()

    app.run(
        debug=False
    )