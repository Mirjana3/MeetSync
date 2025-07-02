// Calendar placeholders
const weeklyPlaceholder = document.querySelector('.weekly-placeholder');
const monthlyPlaceholder = document.querySelector('.monthly-placeholder');


// Task Modal
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');

// Task Details Modal
const taskDetailsModal = document.getElementById('taskDetailsModal');
const editTaskForm = document.getElementById('editTaskForm');
const editTaskDate = document.getElementById('editTaskDate');
const editTaskTime = document.getElementById('editTaskTime');
const editTaskDesc = document.getElementById('editTaskDesc');
const deleteTaskBtn = document.getElementById('deleteTaskBtn');
const taskDateInput = document.getElementById('taskDate');
const taskTimeInput = document.getElementById('taskTime');
const taskDescInput = document.getElementById('taskDesc');


let selectedTaskEl = null;
let currentDate = new Date();

function renderTasks() {
    const allSlots = document.querySelectorAll('.time-slot');
    if (!tasks.length) return;

    // Ukloni postojeće taskove
    allSlots.forEach(slot => {
        slot.querySelectorAll('.task').forEach(task => task.remove());
    });

    tasks.forEach(task => {
        const taskDate = new Date(`${task.date}T${task.time}`);
        const taskDay = (taskDate.getDay() + 6) % 7;
        const taskHour = taskDate.getHours();
        const taskMinutes = taskDate.getMinutes();
        const taskDateStr = task.date;

        for (const slot of allSlots) {
            const slotDay = Number(slot.dataset.day);
            const slotHour = Number(slot.dataset.hour);
            const slotDate = slot.dataset.date;

            if (slotDay === taskDay && slotDate === taskDateStr && taskHour >= slotHour && taskHour < slotHour + 2) {
                const slotHeight = slot.clientHeight;
                const relativeMinutes = (taskHour - slotHour) * 60 + taskMinutes;
                const topOffset = (relativeMinutes / 120) * slotHeight;

                const taskEl = document.createElement('div');
                taskEl.className = 'task';
                taskEl.textContent = `${task.time} - ${task.desc}`;
                taskEl.dataset.id = task.id;
                taskEl.style.position = 'absolute';
                taskEl.style.top = `${topOffset}px`;
                taskEl.style.left = '4px';
                taskEl.style.right = '4px';

                slot.style.position = 'relative'; // Ensure slot is positioned
                slot.appendChild(taskEl);
                break;
            }
        }
    });
}




function listenToTasks() {
    if (!currentGroup) return;

    const tasksRef = collection(db, "groups", currentGroup, "tasks");
    const q = query(tasksRef, orderBy("date"), orderBy("time"));

    onSnapshot(q, (snapshot) => {
        tasks = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            tasks.push({
                id: doc.id,
                ...data
            });
        });

        renderTasks();
    });
}


// === WEEKLY CALENDAR ===
function renderWeek(date) {
    weeklyPlaceholder.innerHTML = '';
    const days = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);

    const container = document.createElement('div');

    const controls = document.createElement('div');
    controls.className = 'week-controls';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous Week';
    prevBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 7);
        renderWeek(currentDate);
        renderMonth(currentDate);
    });

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next Week →';
    nextBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 7);
        renderWeek(currentDate);
        renderMonth(currentDate);
    });

    controls.appendChild(prevBtn);
    controls.appendChild(nextBtn);
    container.appendChild(controls);

    const grid = document.createElement('div');
    grid.className = 'weekly-grid';

    const emptyCell = document.createElement('div');
    emptyCell.className = 'hour-label';
    grid.appendChild(emptyCell);

    for (let i = 0; i < 7; i++) {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';

        const dayName = document.createElement('div');
        dayName.className = 'day-name';
        dayName.textContent = days[i];

        const dayDate = document.createElement('div');
        dayDate.className = 'day-date';

        const thisDate = new Date(monday);
        thisDate.setDate(monday.getDate() + i);
        dayDate.textContent = `${thisDate.getDate()}.${thisDate.getMonth() + 1}`;

        const today = new Date();
        if (
            thisDate.getDate() === today.getDate() &&
            thisDate.getMonth() === today.getMonth() &&
            thisDate.getFullYear() === today.getFullYear()
        ) {
            dayHeader.classList.add('today');
        }

        dayHeader.appendChild(dayName);
        dayHeader.appendChild(dayDate);
        grid.appendChild(dayHeader);
    }

    for (let hour = 0; hour < 24; hour += 2) {
        const hourLabel = document.createElement('div');
        hourLabel.className = 'hour-label';
        hourLabel.textContent = `${hour}:00`;
        grid.appendChild(hourLabel);

        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.dataset.day = dayIndex;
            timeSlot.dataset.hour = hour;

            // Save reference for use in modal
            const slotDate = new Date(monday);
            slotDate.setDate(monday.getDate() + dayIndex);
            timeSlot.dataset.date = slotDate.toISOString().split('T')[0]; // YYYY-MM-DD

            grid.appendChild(timeSlot);
        }
    }

    container.appendChild(grid);
    weeklyPlaceholder.appendChild(container);
    renderTasks();
}
// === MONTHLY CALENDAR ===
function renderMonth(date) {
    monthlyPlaceholder.innerHTML = '';
    const daysOfWeek = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];

    const container = document.createElement('div');
    container.className = 'monthly-placeholder';

    const header = document.createElement('div');
    header.className = 'monthly-header';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '‹';
    prevBtn.setAttribute('aria-label', 'Previous month');
    prevBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderMonth(currentDate);
        renderWeek(currentDate);
    });

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '›';
    nextBtn.setAttribute('aria-label', 'Next month');
    nextBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderMonth(currentDate);
        renderWeek(currentDate);
    });

    const monthYear = document.createElement('div');
    monthYear.textContent = date.toLocaleDateString('hr-HR', {
        month: 'long',
        year: 'numeric',
    });
    monthYear.style.fontWeight = '700';

    header.appendChild(prevBtn);
    header.appendChild(monthYear);
    header.appendChild(nextBtn);
    container.appendChild(header);

    const daysRow = document.createElement('div');
    daysRow.className = 'monthly-grid';

    daysOfWeek.forEach((dayName) => {
        const dayElem = document.createElement('div');
        dayElem.className = 'day-name';
        dayElem.textContent = dayName;
        daysRow.appendChild(dayElem);
    });
    container.appendChild(daysRow);

    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    let firstWeekday = firstDay.getDay();
    firstWeekday = firstWeekday === 0 ? 6 : firstWeekday - 1;

    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    const monthGrid = document.createElement('div');
    monthGrid.className = 'monthly-grid';

    for (let i = 0; i < firstWeekday; i++) {
        const blankDay = document.createElement('div');
        blankDay.className = 'day-cell empty';
        monthGrid.appendChild(blankDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell';
        dayCell.textContent = day;

        const today = new Date();
        if (
            day === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        ) {
            dayCell.classList.add('today');
        }

        // Add click listener to update weekly calendar
        dayCell.addEventListener('click', () => {
            const clickedDate = new Date(date.getFullYear(), date.getMonth(), day);
            const dayOfWeek = clickedDate.getDay();
            const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
            const mondayOfWeek = new Date(clickedDate);
            mondayOfWeek.setDate(clickedDate.getDate() + diffToMonday);

            currentDate = mondayOfWeek;
            renderWeek(currentDate);
        });

        monthGrid.appendChild(dayCell);
    }

    container.appendChild(monthGrid);
    monthlyPlaceholder.appendChild(container);
}

renderWeek(new Date());
renderMonth(new Date());
renderTasks();


export {renderWeek, renderMonth, renderTasks, listenToTasks, currentDate, taskModal, taskForm, cancelTaskBtn, taskDetailsModal, editTaskForm, editTaskDate, editTaskTime, editTaskDesc, deleteTaskBtn, taskDateInput, taskTimeInput, taskDescInput, selectedTaskEl};