document.addEventListener('DOMContentLoaded', function () {
    function hideAllSections() {
        document.querySelectorAll('main .main-content section').forEach(function(section) {
            section.style.display = 'none';
        });
    }

    function showSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = '';
        }
    }

    document.querySelectorAll('.sidebar a').forEach(function(link) {
        link.addEventListener('click', function(event) {
            event.preventDefault(); 

            const sectionId = this.getAttribute('href').substring(1);
            hideAllSections();
            showSection(sectionId);
        });
    });
showSection('dashboard');
});