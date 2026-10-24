document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // ELEMENTS
    // =====================================================

    const deleteModal =
        document.getElementById("deleteModal");

    const deleteChatForm =
        document.getElementById("deleteChatForm");

    const deleteChatTitle =
        document.getElementById("deleteChatTitle");

    const cancelDelete =
        document.getElementById("cancelDelete");


    // =====================================================
    // CLOSE ALL CHAT MENUS
    // =====================================================

    function closeAllMenus() {

        document
            .querySelectorAll(".chat-menu.show")
            .forEach(function (menu) {

                menu.classList.remove("show");

            });

    }


    // =====================================================
    // OPEN DELETE MODAL
    // =====================================================

    function openDeleteModal(deleteUrl, chatTitle) {

        if (!deleteModal) {

            console.error(
                "LumaMind: deleteModal not found"
            );

            return;

        }


        if (!deleteChatForm) {

            console.error(
                "LumaMind: deleteChatForm not found"
            );

            return;

        }


        if (!deleteUrl) {

            console.error(
                "LumaMind: delete URL not found"
            );

            return;

        }


        // ใส่ URL ของแชตที่จะลบ
        deleteChatForm.action = deleteUrl;


        // ใส่ชื่อแชต
        if (deleteChatTitle) {

            if (chatTitle) {

                deleteChatTitle.textContent =
                    `"${chatTitle}"`;

            } else {

                deleteChatTitle.textContent =
                    "บทสนทนานี้";

            }

        }


        // เปิด Modal
        deleteModal.classList.add("show");

    }


    // =====================================================
    // CLOSE DELETE MODAL
    // =====================================================

    function closeDeleteModal() {

        if (!deleteModal) {
            return;
        }


        deleteModal.classList.remove("show");


        if (deleteChatForm) {

            deleteChatForm.action = "";

        }


        if (deleteChatTitle) {

            deleteChatTitle.textContent = "";

        }

    }


    // =====================================================
    // THREE DOT BUTTON
    // =====================================================

    document
        .querySelectorAll(".chat-menu-button")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();
                    event.stopPropagation();


                    const menuId =
                        button.dataset.menuId;


                    if (!menuId) {
                        return;
                    }


                    const menu =
                        document.getElementById(menuId);


                    if (!menu) {
                        return;
                    }


                    const isOpen =
                        menu.classList.contains("show");


                    closeAllMenus();


                    if (!isOpen) {

                        menu.classList.add("show");

                    }

                }
            );

        });


    // =====================================================
    // DELETE MENU BUTTON
    // =====================================================

    document
        .querySelectorAll(".delete-menu-item")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();
                    event.stopPropagation();


                    const deleteUrl =
                        button.dataset.deleteUrl;


                    const chatTitle =
                        button.dataset.chatTitle || "";


                    closeAllMenus();


                    openDeleteModal(
                        deleteUrl,
                        chatTitle
                    );

                }
            );

        });


    // =====================================================
    // CANCEL
    // =====================================================

    if (cancelDelete) {

        cancelDelete.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                closeDeleteModal();

            }
        );

    }


    // =====================================================
    // CLICK BACKDROP
    // =====================================================

    if (deleteModal) {

        deleteModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === deleteModal
                ) {

                    closeDeleteModal();

                }

            }
        );

    }


    // =====================================================
    // CONFIRM DELETE
    // =====================================================

    if (deleteChatForm) {

        deleteChatForm.addEventListener(
            "submit",
            function (event) {

                const deleteUrl =
                    deleteChatForm.getAttribute(
                        "action"
                    );


                if (!deleteUrl) {

                    event.preventDefault();

                    console.error(
                        "LumaMind: delete URL is empty"
                    );

                    return;

                }


                const confirmButton =
                    deleteChatForm.querySelector(
                        ".delete-confirm-button"
                    );


                if (confirmButton) {

                    confirmButton.disabled = true;

                    confirmButton.textContent =
                        "กำลังลบ...";

                }


                // สำคัญ:
                // ไม่ใช้ preventDefault()
                // Browser จะ POST form เข้า Flask โดยตรง

            }
        );

    }


    // =====================================================
    // CLICK OUTSIDE MENU
    // =====================================================

    document.addEventListener(
        "click",
        function (event) {

            if (
                event.target.closest(".chat-menu") ||
                event.target.closest(".chat-menu-button")
            ) {

                return;

            }


            closeAllMenus();

        }
    );


    // =====================================================
    // ESC KEY
    // =====================================================

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key !== "Escape") {
                return;
            }


            closeAllMenus();

            closeDeleteModal();

        }
    );

});