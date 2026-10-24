const csrfToken = document
    .querySelector('meta[name="csrf-token"]')
    .getAttribute("content");

// =========================================================
// LUMAMIND CHAT
// =========================================================

document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // ELEMENTS
    // =====================================================

    const messageInput =
        document.getElementById("messageInput");

    const sendButton =
        document.getElementById("sendButton");

    const chatContent =
        document.getElementById("chatContent");

    const conversationContainer =
        document.getElementById("conversationContainer");


    // ถ้าไม่ได้อยู่หน้าแชท ให้หยุด script
    if (
        !messageInput ||
        !sendButton ||
        !chatContent ||
        !conversationContainer
    ) {
        return;
    }


    // =====================================================
    // CHAT ID
    // =====================================================

    let chatId =
        chatContent.dataset.chatId || null;


    // =====================================================
    // SCROLL TO BOTTOM
    // =====================================================

    function scrollToBottom() {

        requestAnimationFrame(function () {

            chatContent.scrollTop =
                chatContent.scrollHeight;

        });

    }


    /*
        สำคัญ

        ห้ามเรียก scrollToBottom() ตรงนี้ตอนเปิดหน้า

        เพราะตอนกลับมาจาก Dashboard
        หรือ reload หน้าแชทเก่า
        browser จะไม่ถูกบังคับเลื่อนทันที

        เราจะ scroll เฉพาะตอน:
        - ผู้ใช้ส่งข้อความ
        - แสดง typing
        - AI ตอบกลับ
    */


    // =====================================================
    // CREATE USER MESSAGE
    // =====================================================

    function createUserMessage(message) {

        const row =
            document.createElement("div");

        row.className =
            "message-row user-row";


        const bubble =
            document.createElement("div");

        bubble.className =
            "user-message";

        bubble.textContent =
            message;


        row.appendChild(
            bubble
        );

        conversationContainer.appendChild(
            row
        );


        scrollToBottom();

    }


    // =====================================================
    // CREATE BOT MESSAGE
    // =====================================================

    function createBotMessage(message) {

        const row =
            document.createElement("div");

        row.className =
            "message-row bot-row";


        const wrapper =
            document.createElement("div");

        wrapper.className =
            "bot-message";


        const botName =
            document.createElement("div");

        botName.className =
            "bot-name";

        botName.textContent =
            "LumaMind";


        const botText =
            document.createElement("div");

        botText.className =
            "bot-text";

        botText.textContent =
            message;


        wrapper.appendChild(
            botName
        );

        wrapper.appendChild(
            botText
        );

        row.appendChild(
            wrapper
        );

        conversationContainer.appendChild(
            row
        );


        scrollToBottom();

    }


    // =====================================================
    // TYPING INDICATOR
    // =====================================================

    function showTypingIndicator() {

        removeTypingIndicator();


        const row =
            document.createElement("div");

        row.className =
            "message-row bot-row typing-row";

        row.id =
            "typingIndicator";


        const wrapper =
            document.createElement("div");

        wrapper.className =
            "bot-message typing-message";


        const botName =
            document.createElement("div");

        botName.className =
            "bot-name";

        botName.textContent =
            "LumaMind";


        const botText =
            document.createElement("div");

        botText.className =
            "bot-text";


        const typing =
            document.createElement("div");

        typing.className =
            "typing-indicator";

        typing.setAttribute(
            "aria-label",
            "LumaMind กำลังพิมพ์"
        );


        for (let i = 0; i < 3; i++) {

            const dot =
                document.createElement("span");

            typing.appendChild(
                dot
            );

        }


        botText.appendChild(
            typing
        );

        wrapper.appendChild(
            botName
        );

        wrapper.appendChild(
            botText
        );

        row.appendChild(
            wrapper
        );

        conversationContainer.appendChild(
            row
        );


        scrollToBottom();

    }


    // =====================================================
    // REMOVE TYPING
    // =====================================================

    function removeTypingIndicator() {

        const typing =
            document.getElementById(
                "typingIndicator"
            );

        if (typing) {
            typing.remove();
        }

    }


    // =====================================================
    // ERROR MESSAGE
    // =====================================================

    function showErrorMessage() {

        createBotMessage(
            "เกิดข้อผิดพลาดในการตอบกลับ ลองส่งข้อความอีกครั้งนะ"
        );

    }


    // =====================================================
    // UPDATE CHAT TITLE
    // =====================================================

    function updateCurrentChatTitle(
        id,
        title
    ) {

        if (
            !id ||
            !title
        ) {
            return;
        }


        const link =
            document.querySelector(
                `.history-item[href*="chat_id=${id}"]`
            );


        if (!link) {
            return;
        }


        link.textContent =
            title;

        link.title =
            title;

    }


    // =====================================================
    // SEND MESSAGE
    // =====================================================

    async function sendMessage() {

        const message =
            messageInput.value.trim();


        if (
            message === "" ||
            sendButton.disabled
        ) {
            return;
        }


        // =================================================
        // REMOVE WELCOME
        // =================================================

        const welcome =
            document.getElementById(
                "welcome"
            );

        if (welcome) {
            welcome.remove();
        }


        // =================================================
        // SHOW USER MESSAGE
        // =================================================

        createUserMessage(
            message
        );


        messageInput.value =
            "";

        sendButton.disabled =
            true;


        // =================================================
        // SHOW TYPING
        // =================================================

        showTypingIndicator();


        try {

            // =============================================
            // SEND TO FLASK
            // =============================================

            const response =
                await fetch(
                    "/send-message",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                                "X-CSRFToken": csrfToken
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


            let data;


            try {

                data =
                    await response.json();

            }
            catch (jsonError) {

                throw new Error(
                    "Server response is not JSON"
                );

            }


            // =============================================
            // REMOVE TYPING
            // =============================================

            removeTypingIndicator();


            // =============================================
            // SERVER ERROR
            // =============================================

            if (
                !response.ok ||
                !data.success
            ) {

                console.error(
                    "Server error:",
                    data
                );

                showErrorMessage();

                return;
            }


            // =============================================
            // SAVE CHAT ID
            // =============================================

            if (data.chat_id) {

                chatId =
                    data.chat_id;

                chatContent.dataset.chatId =
                    chatId;


                window.history.replaceState(
                    {},
                    "",
                    "/?chat_id=" +
                        encodeURIComponent(
                            chatId
                        )
                );

            }


            // =============================================
            // SHOW BOT MESSAGE
            // =============================================

            if (data.bot_message) {

                createBotMessage(
                    data.bot_message
                );

            }


            // =============================================
            // UPDATE CHAT TITLE
            // =============================================

            if (
                data.chat_title &&
                chatId
            ) {

                updateCurrentChatTitle(
                    chatId,
                    data.chat_title
                );

            }

        }
        catch (error) {

            removeTypingIndicator();


            console.error(
                "Chat error:",
                error
            );


            showErrorMessage();

        }
        finally {

            sendButton.disabled =
                false;

            messageInput.focus();

            scrollToBottom();

        }

    }


    // =====================================================
    // SEND BUTTON
    // =====================================================

    sendButton.addEventListener(
        "click",
        sendMessage
    );


    // =====================================================
    // ENTER
    // =====================================================

    messageInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );


    // =====================================================
    // FOCUS INPUT
    // =====================================================

    messageInput.focus();

});