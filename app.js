google.charts.load('current', {packages: ['corechart', 'table']});
google.charts.setOnLoadCallback(loadData);

function loadData() {
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/1swVg-WaRsX-OjFwoEYhBnxNv9UYQ7N2GMTzBLfxyDRk/gviz/tq?sheet=Курсы';
    fetch(sheetUrl)
        .then(res => res.text())
        .then(data => {
            const json = JSON.parse(data.substr(47).slice(0, -2));
            const rows = json.table.rows.map(r => r.c.map(c => c ? c.v : ""));
            renderLMS(rows);
        });
}

function renderLMS(rows) {
    const sidebar = document.getElementById("sidebar");
    const content = document.getElementById("content");

    const byCourse = {};
    rows.forEach(([course, section, type, title, content]) => {
        if (!byCourse[course]) byCourse[course] = [];
        byCourse[course].push({section, type, title, content});
    });

    sidebar.innerHTML = "";
    Object.entries(byCourse).forEach(([course, lessons], idx) => {
        const header = document.createElement("h3");
        header.textContent = course;
        sidebar.appendChild(header);

        lessons.forEach((lesson, i) => {
            const link = document.createElement("div");
            link.textContent = lesson.title;
            link.className = "lesson-link";
            const key = course + "_" + lesson.title;
            if (localStorage.getItem(key) === "1") {
                link.classList.add("completed");
            }

            link.onclick = () => {
                renderLesson(lesson);
                localStorage.setItem(key, "1");
                link.classList.add("completed");
            };
            sidebar.appendChild(link);
        });
    });
}

function renderLesson(lesson) {
    const content = document.getElementById("content");
    if (lesson.type === "Видео") {
        content.innerHTML = `<h2>${lesson.title}</h2><iframe width="100%" height="400" src="${lesson.content}" frameborder="0" allowfullscreen></iframe>`;
    } else if (lesson.type === "Текст") {
        content.innerHTML = `<h2>${lesson.title}</h2><div>${lesson.content}</div>`;
    } else if (lesson.type === "Вопрос") {
        const parts = lesson.content.split(";").map(s => s.trim());
        const answers = parts.filter(p => !p.startsWith("Ответ:"));
        const correct = parts.find(p => p.startsWith("Ответ:"));
        const correctIndexes = correct ? correct.replace("Ответ:", "").split(",").map(i => parseInt(i.trim()) - 1) : [];

        let html = `<h2>${lesson.title}</h2>`;
        html += `<form id="quiz">`;
        answers.forEach((a, i) => {
            html += `<label><input type="checkbox" name="q" value="${i}"> ${a}</label><br>`;
        });
        html += `<button type="submit">Проверить</button></form><div id="result"></div>`;
        content.innerHTML = html;

        document.getElementById("quiz").onsubmit = function(e) {
            e.preventDefault();
            const form = new FormData(e.target);
            const selected = form.getAll("q").map(Number);
            const isCorrect = selected.length === correctIndexes.length && selected.every(val => correctIndexes.includes(val));
            document.getElementById("result").textContent = isCorrect ? "Верно!" : "Неправильно";
        };
    }
}
