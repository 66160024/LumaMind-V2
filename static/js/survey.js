// =========================================================
// LUMAMIND - SATISFACTION SURVEY
// =========================================================


// =========================================================
// ELEMENTS
// =========================================================

const surveyModal =
    document.getElementById(
        "surveyModal"
    );


const openSurveyButton =
    document.getElementById(
        "openSurveyButton"
    );


const closeSurveyModalButton =
    document.getElementById(
        "closeSurveyModal"
    );


const startSurveyButton =
    document.getElementById(
        "startSurveyButton"
    );


const skipSurveyButton =
    document.getElementById(
        "skipSurveyButton"
    );


const surveyStep1 =
    document.getElementById(
        "surveyStep1"
    );


const surveyStep2 =
    document.getElementById(
        "surveyStep2"
    );


const surveyStep3 =
    document.getElementById(
        "surveyStep3"
    );


const surveyStep4 =
    document.getElementById(
        "surveyStep4"
    );


const surveyStars =
    document.querySelectorAll(
        ".survey-star"
    );


const surveyNextButton =
    document.getElementById(
        "surveyNextButton"
    );


const surveyBackToIntro =
    document.getElementById(
        "surveyBackToIntro"
    );


const surveyBackButton =
    document.getElementById(
        "surveyBackButton"
    );


const surveyRatingError =
    document.getElementById(
        "surveyRatingError"
    );


const surveyComment =
    document.getElementById(
        "surveyComment"
    );


const surveyCharacterCount =
    document.getElementById(
        "surveyCharacterCount"
    );


const submitSurveyButton =
    document.getElementById(
        "submitSurveyButton"
    );


const surveySubmitError =
    document.getElementById(
        "surveySubmitError"
    );


const finishSurveyButton =
    document.getElementById(
        "finishSurveyButton"
    );


let surveyRating =
    null;


// =========================================================
// SHOW STEP
// =========================================================

function showSurveyStep(step) {

    const steps = [
        surveyStep1,
        surveyStep2,
        surveyStep3,
        surveyStep4
    ];


    steps.forEach(
        function (item) {

            item.classList.remove(
                "active"
            );

        }
    );


    step.classList.add(
        "active"
    );
}


// =========================================================
// RESET
// =========================================================

function resetSurvey() {

    surveyRating =
        null;


    surveyComment.value =
        "";


    surveyCharacterCount.textContent =
        "0";


    surveyRatingError.textContent =
        "";


    surveySubmitError.textContent =
        "";


    surveyStars.forEach(
        function (star) {

            star.classList.remove(
                "selected"
            );

        }
    );


    showSurveyStep(
        surveyStep1
    );
}


// =========================================================
// OPEN
// =========================================================

openSurveyButton.addEventListener(
    "click",
    function () {

        resetSurvey();


        surveyModal.classList.add(
            "show"
        );

    }
);


// =========================================================
// CLOSE
// =========================================================

function closeSurveyModal() {

    surveyModal.classList.remove(
        "show"
    );
}


closeSurveyModalButton.addEventListener(
    "click",
    closeSurveyModal
);


skipSurveyButton.addEventListener(
    "click",
    closeSurveyModal
);


finishSurveyButton.addEventListener(
    "click",
    function () {

        closeSurveyModal();

        resetSurvey();

    }
);


surveyModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            surveyModal
        ) {

            closeSurveyModal();

        }

    }
);


// =========================================================
// START SURVEY
// =========================================================

startSurveyButton.addEventListener(
    "click",
    function () {

        showSurveyStep(
            surveyStep2
        );

    }
);


// =========================================================
// STAR RATING
// =========================================================

surveyStars.forEach(
    function (star) {

        star.addEventListener(
            "click",
            function () {

                surveyRating =
                    Number(
                        star.dataset.rating
                    );


                surveyRatingError.textContent =
                    "";


                surveyStars.forEach(
                    function (item) {

                        const rating =
                            Number(
                                item.dataset.rating
                            );


                        if (
                            rating
                            <= surveyRating
                        ) {

                            item.classList.add(
                                "selected"
                            );

                        }

                        else {

                            item.classList.remove(
                                "selected"
                            );

                        }

                    }
                );

            }
        );

    }
);


// =========================================================
// NEXT
// =========================================================

surveyNextButton.addEventListener(
    "click",
    function () {

        if (!surveyRating) {

            surveyRatingError.textContent =
                "กรุณาเลือกคะแนนก่อนนะ";


            return;

        }


        showSurveyStep(
            surveyStep3
        );


        setTimeout(
            function () {

                surveyComment.focus();

            },
            100
        );

    }
);


// =========================================================
// BACK
// =========================================================

surveyBackToIntro.addEventListener(
    "click",
    function () {

        showSurveyStep(
            surveyStep1
        );

    }
);


surveyBackButton.addEventListener(
    "click",
    function () {

        showSurveyStep(
            surveyStep2
        );

    }
);


// =========================================================
// COMMENT COUNT
// =========================================================

surveyComment.addEventListener(
    "input",
    function () {

        surveyCharacterCount.textContent =
            surveyComment.value.length;

    }
);


// =========================================================
// SUBMIT
// =========================================================

submitSurveyButton.addEventListener(
    "click",
    async function () {

        if (!surveyRating) {

            showSurveyStep(
                surveyStep2
            );


            surveyRatingError.textContent =
                "กรุณาเลือกคะแนนก่อนนะ";


            return;

        }


        surveySubmitError.textContent =
            "";


        submitSurveyButton.disabled =
            true;


        submitSurveyButton.textContent =
            "กำลังส่ง...";


        try {

            const chatContent =
                document.getElementById(
                    "chatContent"
                );


            const chatId =
                chatContent
                ? chatContent.dataset.chatId
                : null;


            const response =
                await fetch(
                    "/save-survey",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                                "X-CSRFToken": csrfToken
                        },

                        body:
                            JSON.stringify({
                                rating:
                                    surveyRating,

                                comment:
                                    surveyComment
                                    .value
                                    .trim(),

                                chat_id:
                                    chatId || null
                            })
                    }
                );


            const data =
                await response.json();


            if (!data.success) {

                surveySubmitError.textContent =
                    data.error ||
                    "ไม่สามารถส่งแบบประเมินได้";


                return;

            }


            showSurveyStep(
                surveyStep4
            );

        }

        catch (error) {

            console.error(
                "Survey Error:",
                error
            );


            surveySubmitError.textContent =
                "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";

        }

        finally {

            submitSurveyButton.disabled =
                false;


            submitSurveyButton.textContent =
                "ส่งแบบประเมิน";

        }

    }
);


// =========================================================
// ESCAPE
// =========================================================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
            && surveyModal.classList.contains(
                "show"
            )
        ) {

            closeSurveyModal();

        }

    }
);