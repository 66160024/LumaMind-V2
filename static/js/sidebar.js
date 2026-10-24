document.addEventListener("DOMContentLoaded", function () {

    const sidebar = document.getElementById("mainSidebar");
    const toggleButton = document.getElementById("sidebarToggle");

    if (!sidebar || !toggleButton) {
        return;
    }


    toggleButton.addEventListener("click", function () {

        sidebar.classList.toggle("collapsed");


        if (sidebar.classList.contains("collapsed")) {

            toggleButton.setAttribute(
                "aria-label",
                "เปิดแถบด้านข้าง"
            );

            toggleButton.setAttribute(
                "title",
                "เปิดแถบด้านข้าง"
            );

        } else {

            toggleButton.setAttribute(
                "aria-label",
                "ปิดแถบด้านข้าง"
            );

            toggleButton.setAttribute(
                "title",
                "ปิดแถบด้านข้าง"
            );

        }

    });

});