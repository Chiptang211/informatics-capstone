document.addEventListener('DOMContentLoaded', function () {
    function hideAllSections() {
        document.querySelectorAll('main .main-content section').forEach(function(section) {
            section.style.display = 'none';
        });
    }

    function showSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'flex';
        }
    }
    document.querySelectorAll('.sidebar a').forEach(function(link) {
        if (link.getAttribute('href').startsWith('#')) {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const sectionId = this.getAttribute('href').substring(1);
                hideAllSections();
                showSection(sectionId);
            });
        }
    });
    showSection('dashboard');
});
