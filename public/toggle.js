const toggle = document.getElementById('toggle');
const body = document.body;

const theme = document.cookie
    .split('; ')
    .find((row) => row.startsWith('theme='))
    ?.split('=')[1];

if (theme === "dark"){
    body.classList.add('dark-theme');
    toggle.checked = true;
} else {
    body.classList.add('light-theme');
    toggle.checked = false;
}

toggle.addEventListener('input', e => {
    const isChecked = e.target.checked;

    if (isChecked) {
        body.classList.add('dark-theme');
        document.cookie = "theme=dark";
    } else {
        body.classList.remove('dark-theme');
        document.cookie = "theme=light";
    }
});