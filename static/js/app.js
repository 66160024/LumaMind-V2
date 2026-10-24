// =========================================================
// LUMAMIND - MAIN JAVASCRIPT
// =========================================================


// =========================================================
// CHAT ELEMENTS
// =========================================================

const messageInput =
    document.getElementById(
        "messageInput"
    );

const sendButton =
    document.getElementById(
        "sendButton"
    );

const chatContent =
    document.getElementById(
        "chatContent"
    );


let chatId =
    chatContent.dataset.chatId || null;


// =========================================================
// AI TYPING INDICATOR
// =========================================================

function showTypingIndicator() {

    const typingBubble =
        document.createElement(
            "div"
        );


    typingBubble.classList.add(
        "bot-message",
        "typing-message"
    );


    typingBubble.id =
        "typingIndicator";


    typingBubble.innerHTML = `
        <div
            class="typing-dots"
            aria-label="LumaMind กำลังพิมพ์"
        >
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;


    chatContent.appendChild(
        typingBubble
    );


    chatContent.scrollTop =
        chatContent.scrollHeight;

}


function removeTypingIndicator() {

    const typingIndicator =
        document.getElementById(
            "typingIndicator"
        );


    if (typingIndicator) {

        typingIndicator.remove();

    }

}


// =========================================================
// SEND MESSAGE
// =========================================================

async function sendMessage() {

    const message =
        messageInput.value.trim();


    if (message === "") {

        return;

    }


    // ป้องกันกดส่งซ้ำ
    // ตอน AI กำลังตอบ

    sendButton.disabled = true;


    const welcome =
        document.getElementById(
            "welcome"
        );


    if (welcome) {

        welcome.style.display =
            "none";

    }


    // =========================
    // USER MESSAGE
    // =========================

    const userBubble =
        document.createElement(
            "div"
        );


    userBubble.classList.add(
        "user-message"
    );


    userBubble.textContent =
        message;


    chatContent.appendChild(
        userBubble
    );


    messageInput.value = "";


    chatContent.scrollTop =
        chatContent.scrollHeight;


    // แสดงจุดกำลังพิมพ์

    showTypingIndicator();


    try {

        const response =
            await fetch(
                "/send-message",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            message:
                                message,

                            chat_id:
                                chatId
                        })
                }
            );


        const data =
            await response.json();


        removeTypingIndicator();


        if (!data.success) {

            console.error(
                data.error
            );


            const errorBubble =
                document.createElement(
                    "div"
                );


            errorBubble.classList.add(
                "bot-message"
            );


            errorBubble.textContent =
                "เกิดข้อผิดพลาดในการตอบกลับ ลองส่งข้อความอีกครั้งนะ 🌿";


            chatContent.appendChild(
                errorBubble
            );


            return;

        }


        chatId =
            data.chat_id;


        chatContent.dataset.chatId =
            chatId;


        // =========================
        // AI MESSAGE
        // =========================

        const botBubble =
            document.createElement(
                "div"
            );


        botBubble.classList.add(
            "bot-message"
        );


        botBubble.textContent =
            data.bot_message;


        chatContent.appendChild(
            botBubble
        );


        chatContent.scrollTop =
            chatContent.scrollHeight;


        window.history.replaceState(
            {},
            "",
            "/?chat_id=" + chatId
        );

    }

    catch (error) {

        removeTypingIndicator();


        console.error(
            "เกิดข้อผิดพลาด:",
            error
        );


        const errorBubble =
            document.createElement(
                "div"
            );


        errorBubble.classList.add(
            "bot-message"
        );


        errorBubble.textContent =
            "ตอนนี้ LumaMind ตอบกลับไม่ได้ชั่วคราว ลองใหม่อีกครั้งนะ 🌿";


        chatContent.appendChild(
            errorBubble
        );

    }

    finally {

        sendButton.disabled =
            false;


        messageInput.focus();


        chatContent.scrollTop =
            chatContent.scrollHeight;

    }

}


// =========================================================
// SEND MESSAGE EVENTS
// =========================================================

sendButton.addEventListener(
    "click",
    sendMessage
);


messageInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter"
            && !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


// =========================================================
// FEELING JAR - SAVE
// =========================================================

const feelingModal =
    document.getElementById(
        "feelingModal"
    );


const openFeelingModal =
    document.getElementById(
        "openFeelingModal"
    );


const closeFeelingModalButton =
    document.getElementById(
        "closeFeelingModal"
    );


const cancelFeeling =
    document.getElementById(
        "cancelFeeling"
    );


const saveFeeling =
    document.getElementById(
        "saveFeeling"
    );


const feelingText =
    document.getElementById(
        "feelingText"
    );


const feelingError =
    document.getElementById(
        "feelingError"
    );


const feelingSuccess =
    document.getElementById(
        "feelingSuccess"
    );


const feelingMoodButtons =
    document.querySelectorAll(
        ".feeling-mood-button"
    );


let feelingMood = null;


// =========================================================
// OPEN FEELING FORM
// =========================================================

openFeelingModal.addEventListener(
    "click",
    function () {

        feelingModal.classList.add(
            "show"
        );


        feelingError.textContent =
            "";


        feelingSuccess.textContent =
            "";


        setTimeout(
            function () {

                feelingText.focus();

            },
            100
        );

    }
);


// =========================================================
// SELECT MOOD
// =========================================================

feelingMoodButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                feelingMoodButtons.forEach(
                    function (item) {

                        item.classList.remove(
                            "selected"
                        );

                    }
                );


                button.classList.add(
                    "selected"
                );


                feelingMood =
                    button.dataset.mood;

            }
        );

    }
);


// =========================================================
// RESET FEELING FORM
// =========================================================

function resetFeelingForm() {

    feelingText.value =
        "";


    feelingMood =
        null;


    feelingError.textContent =
        "";


    feelingSuccess.textContent =
        "";


    feelingMoodButtons.forEach(
        function (button) {

            button.classList.remove(
                "selected"
            );

        }
    );

}


// =========================================================
// CLOSE FEELING FORM
// =========================================================

function closeFeelingModal() {

    feelingModal.classList.remove(
        "show"
    );


    resetFeelingForm();

}


closeFeelingModalButton.addEventListener(
    "click",
    closeFeelingModal
);


cancelFeeling.addEventListener(
    "click",
    closeFeelingModal
);


feelingModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            feelingModal
        ) {

            closeFeelingModal();

        }

    }
);


// =========================================================
// SAVE FEELING
// =========================================================

saveFeeling.addEventListener(
    "click",
    async function () {

        const text =
            feelingText.value.trim();


        feelingError.textContent =
            "";


        feelingSuccess.textContent =
            "";


        if (text === "") {

            feelingError.textContent =
                "เขียนความรู้สึกของคุณก่อนนะ";


            feelingText.focus();


            return;

        }


        if (!feelingMood) {

            feelingError.textContent =
                "เลือกความรู้สึกของวันนี้ก่อนนะ";


            return;

        }


        saveFeeling.disabled =
            true;


        saveFeeling.textContent =
            "กำลังเก็บ...";


        try {

            const response =
                await fetch(
                    "/save-feeling",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                feeling_text:
                                    text,

                                mood:
                                    feelingMood
                            })
                    }
                );


            const data =
                await response.json();


            if (!data.success) {

                feelingError.textContent =
                    data.error ||
                    "ไม่สามารถบันทึกได้";


                return;

            }


            feelingSuccess.textContent =
                "เก็บความรู้สึกของวันนี้เรียบร้อยแล้ว 🌿";


            setTimeout(
                function () {

                    closeFeelingModal();

                },
                900
            );

        }

        catch (error) {

            console.error(
                "Save Feeling Error:",
                error
            );


            feelingError.textContent =
                "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง";

        }

        finally {

            saveFeeling.disabled =
                false;


            saveFeeling.textContent =
                "เก็บไว้ 🌿";

        }

    }
);


// =========================================================
// FEELING JAR HISTORY
// =========================================================

const viewFeelingJarButton =
    document.getElementById(
        "viewFeelingJarButton"
    );


const feelingHistoryModal =
    document.getElementById(
        "feelingHistoryModal"
    );


const closeFeelingHistoryButton =
    document.getElementById(
        "closeFeelingHistory"
    );


const feelingHistoryList =
    document.getElementById(
        "feelingHistoryList"
    );


// =========================================================
// MOOD INFORMATION
// =========================================================

const feelingMoodInfo = {

    good: {
        emoji: "😊",
        label: "ดี"
    },

    calm: {
        emoji: "😌",
        label: "สงบ"
    },

    neutral: {
        emoji: "😐",
        label: "เฉย ๆ"
    },

    sad: {
        emoji: "😔",
        label: "เศร้า"
    },

    anxious: {
        emoji: "😰",
        label: "กังวล"
    }

};


// =========================================================
// LOAD FEELING HISTORY
// =========================================================

async function loadFeelingHistory() {

    feelingHistoryList.innerHTML = `
        <div class="feeling-history-loading">
            กำลังเปิด Feeling Jar...
        </div>
    `;


    try {

        const response =
            await fetch(
                "/feeling-history"
            );


        const data =
            await response.json();


        if (!data.success) {

            feelingHistoryList.innerHTML = `
                <div class="feeling-history-error">
                    ไม่สามารถเปิด Feeling Jar ได้
                </div>
            `;


            return;

        }


        renderFeelingHistory(
            data.feelings
        );

    }

    catch (error) {

        console.error(
            "Feeling History Error:",
            error
        );


        feelingHistoryList.innerHTML = `
            <div class="feeling-history-error">
                เกิดข้อผิดพลาดในการโหลด Feeling Jar
            </div>
        `;

    }

}


// =========================================================
// OPEN FEELING HISTORY
// =========================================================

viewFeelingJarButton.addEventListener(
    "click",
    async function () {

        feelingHistoryModal.classList.add(
            "show"
        );


        await loadFeelingHistory();

    }
);


// =========================================================
// RENDER FEELING HISTORY
// =========================================================

function renderFeelingHistory(
    feelings
) {

    feelingHistoryList.innerHTML =
        "";


    // =========================
    // EMPTY FEELING JAR
    // =========================

    if (
        !feelings
        || feelings.length === 0
    ) {

        const emptyBox =
            document.createElement(
                "div"
            );


        emptyBox.classList.add(
            "feeling-history-empty"
        );


        emptyBox.innerHTML = `
            <div class="feeling-empty-icon">
                🫙
            </div>

            <h3>
                Feeling Jar ยังว่างอยู่
            </h3>

            <p>
                เมื่อคุณบันทึกความรู้สึก
                ความรู้สึกเหล่านั้นจะมาอยู่ที่นี่
            </p>
        `;


        feelingHistoryList.appendChild(
            emptyBox
        );


        return;

    }


    // =========================
    // FEELING ITEMS
    // =========================

    feelings.forEach(
        function (feeling) {

            const mood =
                feelingMoodInfo[
                    feeling.mood
                ] || {
                    emoji: "🌿",
                    label: "ความรู้สึก"
                };


            const item =
                document.createElement(
                    "div"
                );


            item.classList.add(
                "feeling-history-item"
            );


            // =========================
            // ITEM HEADER
            // =========================

            const itemHeader =
                document.createElement(
                    "div"
                );


            itemHeader.classList.add(
                "feeling-history-item-header"
            );


            // =========================
            // MOOD
            // =========================

            const moodBox =
                document.createElement(
                    "div"
                );


            moodBox.classList.add(
                "feeling-history-mood"
            );


            const moodEmoji =
                document.createElement(
                    "span"
                );


            moodEmoji.classList.add(
                "feeling-history-emoji"
            );


            moodEmoji.textContent =
                mood.emoji;


            const moodLabel =
                document.createElement(
                    "span"
                );


            moodLabel.textContent =
                mood.label;


            moodBox.appendChild(
                moodEmoji
            );


            moodBox.appendChild(
                moodLabel
            );


            // =========================
            // RIGHT SIDE
            // =========================

            const itemRight =
                document.createElement(
                    "div"
                );


            itemRight.classList.add(
                "feeling-history-item-right"
            );


            // วันที่และเวลา

            const date =
                document.createElement(
                    "span"
                );


            date.classList.add(
                "feeling-history-date"
            );


            date.textContent =
                feeling.created_at;


            // ปุ่มลบ

            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.type =
                "button";


            deleteButton.classList.add(
                "feeling-history-delete"
            );


            deleteButton.textContent =
                "🗑";


            deleteButton.setAttribute(
                "aria-label",
                "ลบบันทึก"
            );


            deleteButton.setAttribute(
                "title",
                "ลบบันทึก"
            );


            deleteButton.addEventListener(
                "click",
                function () {

                    openDeleteFeelingModal(
                        feeling.feeling_id,
                        feeling.feeling_text
                    );

                }
            );


            itemRight.appendChild(
                date
            );


            itemRight.appendChild(
                deleteButton
            );


            itemHeader.appendChild(
                moodBox
            );


            itemHeader.appendChild(
                itemRight
            );


            // =========================
            // FEELING TEXT
            // =========================

            const text =
                document.createElement(
                    "p"
                );


            text.classList.add(
                "feeling-history-text"
            );


            // ใช้ textContent
            // เพื่อไม่ให้ข้อความผู้ใช้
            // กลายเป็น HTML

            text.textContent =
                feeling.feeling_text;


            item.appendChild(
                itemHeader
            );


            item.appendChild(
                text
            );


            feelingHistoryList.appendChild(
                item
            );

        }
    );

}


// =========================================================
// CLOSE FEELING HISTORY
// =========================================================

function closeFeelingHistory() {

    feelingHistoryModal.classList.remove(
        "show"
    );

}


closeFeelingHistoryButton.addEventListener(
    "click",
    closeFeelingHistory
);


feelingHistoryModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            feelingHistoryModal
        ) {

            closeFeelingHistory();

        }

    }
);


// =========================================================
// DELETE FEELING
// =========================================================

const deleteFeelingModal =
    document.getElementById(
        "deleteFeelingModal"
    );


const deleteFeelingPreview =
    document.getElementById(
        "deleteFeelingPreview"
    );


const deleteFeelingError =
    document.getElementById(
        "deleteFeelingError"
    );


const cancelDeleteFeeling =
    document.getElementById(
        "cancelDeleteFeeling"
    );


const confirmDeleteFeeling =
    document.getElementById(
        "confirmDeleteFeeling"
    );


let feelingToDeleteId =
    null;


// =========================================================
// OPEN DELETE FEELING MODAL
// =========================================================

function openDeleteFeelingModal(
    feelingId,
    feelingTextValue
) {

    feelingToDeleteId =
        feelingId;


    deleteFeelingError.textContent =
        "";


    deleteFeelingPreview.textContent =
        feelingTextValue;


    deleteFeelingModal.classList.add(
        "show"
    );

}


// =========================================================
// CLOSE DELETE FEELING MODAL
// =========================================================

function closeDeleteFeelingModal() {

    deleteFeelingModal.classList.remove(
        "show"
    );


    feelingToDeleteId =
        null;


    deleteFeelingPreview.textContent =
        "";


    deleteFeelingError.textContent =
        "";

}


// =========================================================
// CANCEL DELETE FEELING
// =========================================================

cancelDeleteFeeling.addEventListener(
    "click",
    closeDeleteFeelingModal
);


// คลิกด้านนอก Modal เพื่อปิด

deleteFeelingModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            deleteFeelingModal
        ) {

            closeDeleteFeelingModal();

        }

    }
);


// =========================================================
// CONFIRM DELETE FEELING
// =========================================================

confirmDeleteFeeling.addEventListener(
    "click",
    async function () {

        if (!feelingToDeleteId) {

            return;

        }


        deleteFeelingError.textContent =
            "";


        confirmDeleteFeeling.disabled =
            true;


        confirmDeleteFeeling.textContent =
            "กำลังลบ...";


        try {

            const response =
                await fetch(
                    "/delete-feeling/"
                    + feelingToDeleteId,
                    {
                        method: "DELETE"
                    }
                );


            const data =
                await response.json();


            if (!data.success) {

                deleteFeelingError.textContent =
                    data.error ||
                    "ไม่สามารถลบบันทึกได้";


                return;

            }


            // ปิดกล่องยืนยัน

            closeDeleteFeelingModal();


            // โหลดรายการ Feeling Jar
            // ใหม่ทันที

            await loadFeelingHistory();

        }

        catch (error) {

            console.error(
                "Delete Feeling Error:",
                error
            );


            deleteFeelingError.textContent =
                "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";

        }

        finally {

            confirmDeleteFeeling.disabled =
                false;


            confirmDeleteFeeling.textContent =
                "🗑 ลบบันทึก";

        }

    }
);


// =========================================================
// THREE DOT CHAT MENU
// =========================================================

const menuButtons =
    document.querySelectorAll(
        ".chat-menu-button"
    );


function closeAllMenus() {

    document
        .querySelectorAll(
            ".chat-menu.show"
        )
        .forEach(
            function (menu) {

                menu.classList.remove(
                    "show"
                );


                const row =
                    menu.closest(
                        ".history-row"
                    );


                if (row) {

                    row.classList.remove(
                        "menu-open"
                    );

                }

            }
        );

}


menuButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();


                const menuId =
                    button.dataset.menuId;


                const targetMenu =
                    document.getElementById(
                        menuId
                    );


                const row =
                    button.closest(
                        ".history-row"
                    );


                const isOpen =
                    targetMenu.classList.contains(
                        "show"
                    );


                closeAllMenus();


                if (!isOpen) {

                    targetMenu.classList.add(
                        "show"
                    );


                    row.classList.add(
                        "menu-open"
                    );

                }

            }
        );

    }
);


// =========================================================
// CLICK OUTSIDE CHAT MENU
// =========================================================

document.addEventListener(
    "click",
    function (event) {

        if (
            event.target.closest(
                ".chat-menu"
            )
        ) {

            return;

        }


        if (
            event.target.closest(
                ".chat-menu-button"
            )
        ) {

            return;

        }


        closeAllMenus();

    }
);


// =========================================================
// DELETE CHAT MODAL
// =========================================================

const deleteModal =
    document.getElementById(
        "deleteModal"
    );


const deleteChatForm =
    document.getElementById(
        "deleteChatForm"
    );


const deleteChatTitle =
    document.getElementById(
        "deleteChatTitle"
    );


const cancelDelete =
    document.getElementById(
        "cancelDelete"
    );


const deleteButtons =
    document.querySelectorAll(
        ".delete-menu-item"
    );


deleteButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();


                const deleteUrl =
                    button.dataset.deleteUrl;


                const chatTitle =
                    button.dataset.chatTitle;


                deleteChatForm.action =
                    deleteUrl;


                deleteChatTitle.textContent =
                    `"${chatTitle}"`;


                deleteModal.classList.add(
                    "show"
                );


                closeAllMenus();

            }
        );

    }
);


// =========================================================
// CLOSE DELETE CHAT MODAL
// =========================================================

function closeDeleteModal() {

    deleteModal.classList.remove(
        "show"
    );

}


cancelDelete.addEventListener(
    "click",
    closeDeleteModal
);


deleteModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            deleteModal
        ) {

            closeDeleteModal();

        }

    }
);


// =========================================================
// ESCAPE KEY
// =========================================================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key !== "Escape"
        ) {

            return;

        }


        // ปิดหน้าบันทึก Feeling

        if (
            feelingModal.classList.contains(
                "show"
            )
        ) {

            closeFeelingModal();

        }


        // ปิด Feeling Jar ย้อนหลัง

        if (
            feelingHistoryModal.classList.contains(
                "show"
            )
        ) {

            closeFeelingHistory();

        }


        // ปิดยืนยันลบ Feeling

        if (
            deleteFeelingModal.classList.contains(
                "show"
            )
        ) {

            closeDeleteFeelingModal();

        }


        // ปิดยืนยันลบ Chat

        if (
            deleteModal.classList.contains(
                "show"
            )
        ) {

            closeDeleteModal();

        }

    }
);