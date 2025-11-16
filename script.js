document.addEventListener('DOMContentLoaded', () => {

    const tableBody = document.querySelector('#classementTable tbody');
    const dossardFilter = document.getElementById('dossardFilter');
    const nameFilter = document.getElementById('nameFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const tableHeaders = document.querySelectorAll('#classementTable thead th');

    let allRunners = [];
    let currentSortColumn = null;
    let currentSortDirection = 'asc'; 

    // Parse CSV data
    function parseCSV(csv) {
        const lines = csv.trim().split('\n');
        const headers = lines[0].split(',').map(header => header.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(value => value.trim());
            const runner = {};
            headers.forEach((header, index) => {
                const key = header.replace(/\s+/g, '').replace(/é/g, 'e').replace(/è/g, 'e').toLowerCase(); 
                runner[key] = values[index];
            });
            data.push(runner);
        }
        return data;
    }

    function timeToSeconds(timeStr) {
        if (!timeStr) return 0;
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        return 0;
    }

    function renderTable(runnersToDisplay) {
        tableBody.innerHTML = ''; 

        const headerMap = {
            'place': 'Place',
            'dossard': 'Dossard',
            'nom': 'Nom',
            'categorie': 'Catégorie',
            'temps': 'Temps',
            'tempspuce': 'Temps puce',
            'placeparcategorie': 'Place par catégorie',
            'ecartparcategorie': 'Ecart par catégorie'
        };

        runnersToDisplay.forEach(runner => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = runner.place;
            row.insertCell().textContent = runner.dossard;
            row.insertCell().textContent = runner.nom;
            row.insertCell().textContent = runner.categorie;
            row.insertCell().textContent = runner.temps;
            row.insertCell().textContent = runner.tempspuce;
            row.insertCell().textContent = runner.placeparcategorie;
            row.insertCell().textContent = runner.ecartparcategorie;

            row.cells[0].setAttribute('data-label', headerMap['place']);
            row.cells[1].setAttribute('data-label', headerMap['dossard']);
            row.cells[2].setAttribute('data-label', headerMap['nom']);
            row.cells[3].setAttribute('data-label', headerMap['categorie']);
            row.cells[4].setAttribute('data-label', headerMap['temps']);
            row.cells[5].setAttribute('data-label', headerMap['tempspuce']);
            row.cells[6].setAttribute('data-label', headerMap['placeparcategorie']);
            row.cells[7].setAttribute('data-label', headerMap['ecartparcategorie']);
        });
    }

    function populateCategoryFilter(runners) {
        const categories = [...new Set(runners.map(runner => runner.categorie))].sort();
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    function applyFilters() {
        const dossardVal = dossardFilter.value.toLowerCase();
        const nameVal = nameFilter.value.toLowerCase();
        const categoryVal = categoryFilter.value;

        let filteredRunners = allRunners.filter(runner => {
            const matchesDossard = runner.dossard.toLowerCase().includes(dossardVal);
            // Remove special characters and accents from the name for better filtering
            const runnerNameNormalized = runner.nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, '');
            const nameValNormalized = nameVal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, '');

            const matchesName = runnerNameNormalized.includes(nameValNormalized);
            const matchesCategory = categoryVal === '' || runner.categorie === categoryVal;
            return matchesDossard && matchesName && matchesCategory;
        });

        if (currentSortColumn) {
            sortRunners(currentSortColumn, currentSortDirection, filteredRunners);
        } else {
            filteredRunners.sort((a, b) => parseInt(a.place) - parseInt(b.place));
        }

        renderTable(filteredRunners);
    }

    function sortRunners(column, direction, runnersArray = allRunners) {
        const isNumeric = ['place', 'dossard', 'placeparcategorie'].includes(column);
        const isTime = ['temps', 'tempspuce', 'ecartparcategorie'].includes(column);

        runnersArray.sort((a, b) => {
            let valA, valB;

            if (isNumeric) {
                valA = parseInt(a[column]);
                valB = parseInt(b[column]);
            } else if (isTime) {
                valA = timeToSeconds(a[column]);
                valB = timeToSeconds(b[column]);
            } else {
                valA = a[column].toLowerCase();
                valB = b[column].toLowerCase();
            }

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        renderTable(runnersArray);
    }

    dossardFilter.addEventListener('input', applyFilters);
    nameFilter.addEventListener('input', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);

    fetch('results2.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response.text();
        })
        .then(csvText => {
            allRunners = parseCSV(csvText);
            populateCategoryFilter(allRunners);
            renderTable(allRunners);
        })
        .catch(error => {
            console.error("Erreur lors du chargement du fichier CSV:", error);
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Erreur de chargement des données: ${error.message}</td></tr>`;
        });
});