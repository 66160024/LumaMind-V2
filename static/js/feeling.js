// =========================================================
// LUMAMIND - FEELING JAR
// =========================================================


// =========================================================
// SAVE FEELING ELEMENTS
// =========================================================

// =========================================================
// CSRF TOKEN
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


let feelingMood =
    null;


// =========================================================
// OPEN SAVE FEELING MODAL
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
// CLOSE SAVE FEELING MODAL
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
                                "application/json",
                                "X-CSRFToken": csrfToken
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
// FEELING HISTORY ELEMENTS
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
            // HEADER
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


            const date =
                document.createElement(
                    "span"
                );


            date.classList.add(
                "feeling-history-date"
            );


            date.textContent =
                feeling.created_at;


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
            // TEXT
            // =========================

            const text =
                document.createElement(
                    "p"
                );


            text.classList.add(
                "feeling-history-text"
            );


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
// DELETE FEELING ELEMENTS
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
    "/delete-feeling/" + feelingToDeleteId,
    {
        method: "DELETE",
        headers: {
            "X-CSRFToken": csrfToken
        }
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


            closeDeleteFeelingModal();


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
// ESCAPE - FEELING MODALS
// =========================================================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key !== "Escape"
        ) {

            return;

        }


        if (
            deleteFeelingModal.classList.contains(
                "show"
            )
        ) {

            closeDeleteFeelingModal();

            return;

        }


        if (
            feelingHistoryModal.classList.contains(
                "show"
            )
        ) {

            closeFeelingHistory();

            return;

        }


        if (
            feelingModal.classList.contains(
                "show"
            )
        ) {

            closeFeelingModal();

        }

    }
);