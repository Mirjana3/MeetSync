// inicialize firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";// Firebase config
import { onSnapshot } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAkqPpwbi2bOpaihRkePggeflQMQGBcXoc",
  authDomain: "meetsync-e6f72.firebaseapp.com",
  projectId: "meetsync-e6f72",
  storageBucket: "meetsync-e6f72.appspot.com",
  messagingSenderId: "1062510540690",
  appId: "1:1062510540690:web:8ec1de0518bc2b6611734b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let currentGroup = "MY CALENDAR";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = '../login.html';
  }
  else {
    currentUser = user;
    listenToTasks();
  }
});

async function saveTaskToFirestore(task) {
  if (!currentUser) {
    console.warn("No user is logged in.");
    return;
  }
  if (!currentGroup) {
    console.warn("No group selected.");
    return;
  }

  try {
    console.log('Saving task to Firestore:', task);
    const taskRef = await addDoc(collection(db, "tasks"), {
      userId: currentUser.uid,
      group: currentGroup,
      date: task.date,
      time: task.time,
      desc: task.desc,
      createdAt: new Date()
    });
    task.id = taskRef.id; // Assign the generated ID to the task object
    console.log('Task saved. ')
  } catch (error) {
    console.error("Error saving task:", error);
  }
}

function listenToTasks() {
  const q = query(
    collection(db, "tasks"),
    where("userId", "==", currentUser.uid),
    where("group", "==", currentGroup),
    orderby("createdAt", "desc")
  );

  onSnapshot(q, (querySnapshot) => {
    tasks = [];
    querySnapshot.forEach((docSnap) => {
      const task = docSnap.data();
      task.id = docSnap.id;
      tasks.push(task);
    });
    renderTasks();
  });
}

async function deleteTaskFromFirestore(taskId) {
  try {
    await deleteDoc(doc(db, "tasks", taskId));
  } catch (error) {
    console.error("Delete failed:", error);
  }
}

async function updateTaskInFirestore(taskId, updatedTask) {
  try {
    await updateDoc(doc(db, "tasks", taskId), updatedTask);
  } catch (error) {
    console.error("Update failed:", error);
  }
}

// Keyboard accessibility for closing the sidenav
document.addEventListener('keydown', (event) => {
  if (event.key === "Escape") {
    closeNav(); // Close the sidenav when Escape is pressed
  }
});

window.addEventListener('DOMContentLoaded', () => {
  // Sidebar and user info
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarClose = document.getElementById('sidebarClose');
  const logoutBtn = document.getElementById('logoutBtn');
  const usernameContainer = document.getElementById('username-container');
  const usernameDisplay = document.getElementById('username-display');
  const usernameInput = document.getElementById('username-input');
  const groupListContainer = document.getElementById('group-list-container');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  // Calendar placeholders
  const weeklyPlaceholder = document.querySelector('.weekly-placeholder');
  const monthlyPlaceholder = document.querySelector('.monthly-placeholder');

  // Chat
  const messages = document.getElementById('messages');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');

  // Task Modal
  const taskModal = document.getElementById('taskModal');
  const taskForm = document.getElementById('taskForm');
  const taskDate = document.getElementById('taskDate');
  const taskTime = document.getElementById('taskTime');
  const taskDesc = document.getElementById('taskDesc');
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

  // Create Group Modal
  const createGroupModal = document.getElementById('createGroupModal');
  const groupNameInput = document.getElementById('groupNameInput');
  const generatedGroupCode = document.getElementById('generatedGroupCode');
  const cancelCreateGroupBtn = document.getElementById('cancelCreateGroupBtn');
  const confirmCreateGroupBtn = document.getElementById('confirmCreateGroupBtn');

  // Join Group Modal
  const joinGroupModal = document.getElementById('joinGroupModal');
  const joinGroupCodeInput = document.getElementById('joinGroupCodeInput');
  const cancelJoinGroupBtn = document.getElementById('cancelJoinGroupBtn');
  const confirmJoinGroupBtn = document.getElementById('confirmJoinGroupBtn');

  // Delete Group Modal
  const deleteGroupModal = document.getElementById('deleteGroupModal');
  const cancelDeleteGroupBtn = document.getElementById('cancelDeleteGroupBtn');
  const confirmDeleteGroupBtn = document.getElementById('confirmDeleteGroupBtn');

  // Settings Modal
  const settingsModal = document.getElementById('settingsModal');
  const settingsForm = document.getElementById('settingsForm');
  const themeSelect = document.getElementById('themeSelect');
  const notificationToggle = document.getElementById('notificationToggle');
  const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');

  // Help Modal
  const helpModal = document.getElementById('helpModal');
  const cancelHelpBtn = document.getElementById('cancelHelpBtn');


  let selectedTaskEl = null;
  let currentDate = new Date();

  // Sidebar toggle
  function openSidebar() {
    sidebar.classList.add('open');
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
  }
  sidebarToggle.addEventListener('click', () => {
    if (sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });
  sidebarClose.addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  // Keyboard accessibility for closing the sidenav
  document.addEventListener('keydown', (event) => {
    if (event.key === "Escape") {
      closeSidebar(); // was closeNav(); but I assume you meant closeSidebar()
    }
  });

  // --- Nickname logic ---
  let nickname = localStorage.getItem('nickname') || 'User';
  usernameDisplay.textContent = nickname;

  usernameContainer.addEventListener('click', () => {
    usernameDisplay.style.display = 'none';
    usernameInput.style.display = 'inline-block';
    usernameInput.value = nickname;
    usernameInput.focus();
    usernameInput.select();
  });

  function saveNickname() {
    const newName = usernameInput.value.trim();
    if (newName.length > 0) {
      nickname = newName;
      usernameDisplay.textContent = nickname;
      localStorage.setItem('nickname', nickname);
    }
    usernameInput.style.display = 'none';
    usernameDisplay.style.display = 'inline';
  }

  usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      saveNickname();
    } else if (e.key === 'Escape') {
      usernameInput.style.display = 'none';
      usernameDisplay.style.display = 'inline';
    }
  });

  usernameInput.addEventListener('blur', saveNickname);

  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  function saveTasksToStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }
  function loadTasksFromStorage() {
  tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  }


  loadTasksFromStorage();
  saveTasksToStorage();

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('time-slot')) {
      const date = e.target.dataset.date;
      const hour = e.target.dataset.hour;
      taskDateInput.value = date;
      taskTimeInput.value = `${String(hour).padStart(2, '0')}:00`;
      taskDescInput.value = '';
      taskModal.style.display = 'flex';
    } else if (e.target.classList.contains('task')) {
      selectedTaskEl = e.target;
      const taskInfo = selectedTaskEl.dataset;
      editTaskDate.value = taskInfo.date;
      editTaskTime.value = taskInfo.time;
      editTaskDesc.value = selectedTaskEl.textContent;
      taskDetailsModal.style.display = 'flex';
    }
  });

  cancelTaskBtn.addEventListener('click', () => {
    taskModal.style.display = 'none';
  });

  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const desc = taskDescInput.value.trim();
    const dateStr = taskDateInput.value;
    const timeStr = taskTimeInput.value;
    if (!desc || !dateStr || !timeStr) return;

    const newTask = { 
      id: crypto.randomUUID(), // Generate a unique ID for the task
      date: dateStr, 
      time: timeStr, 
      desc 
    };

    tasks.push(newTask);
    saveTasksToStorage();
    renderTasks();

    await saveTaskToFirestore(newTask);
    taskModal.style.display = 'none';
    console.log('Submitting task:', { desc, dateStr, timeStr });
  });

  deleteTaskBtn.addEventListener('click', async () => {
    if (selectedTaskEl) {
      const taskId = selectedTaskEl.dataset.id;

      tasks = tasks.filter(t => t.id !== taskId);
      saveTasksToStorage();
      renderTasks();

      await deleteTaskFromFirestore(taskId);
      taskDetailsModal.style.display = 'none';
    }
  });

  editTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newDesc = editTaskDesc.value.trim();
    const newDate = editTaskDate.value;
    const newTime = editTaskTime.value;
    if (!newDesc || !newDate || !newTime) return;

    const taskId = selectedTaskEl.dataset.id;

    const task = tasks.find(task => task.id === taskId);
    if (task) {
      task.date = newDate;
      task.time = newTime;
      task.desc = newDesc;
      saveTasksToStorage();
      renderTasks();
    }

    await updateTaskInFirestore(taskId, {
      date: newDate,
      time: newTime,
      desc: newDesc
    });
    taskDetailsModal.style.display = 'none';
  });

  function renderTasks() {
    const allSlots = document.querySelectorAll('.time-slot');
    if(!tasks.length) return;

    allSlots.forEach(slot => {
      slot.querySelectorAll('.task').forEach(task => task.remove());
    });

    tasks.forEach(task => {
      const taskDate = new Date(`${task.date}T${task.time}`);
      const taskDay = (taskDate.getDay() + 6) % 7;
      const taskHour = taskDate.getHours();
      
      for (const slot of allSlots) {
        if (
          Number(slot.dataset.day) === taskDay &&
          Number(slot.dataset.hour) === taskHour &&
          slot.dataset.date === task.date
        ) {
          const taskEl = document.createElement('div');
          taskEl.className = 'task';
          taskEl.textContent = task.desc;
          taskEl.dataset.id = task.id;
          taskEl.dataset.date = task.date;
          taskEl.dataset.time = task.time;
          slot.appendChild(taskEl);
          break;
        }
      }
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


  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
  }


  // --- Simple chat functionality (example) ---
  function appendMessage(text, sender = 'You') {
    const msgElem = document.createElement('div');
    msgElem.textContent = `${sender}: ${text}`;
    messages.appendChild(msgElem);
    messages.scrollTop = messages.scrollHeight;
  }


  // Chat send
  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // === CHAT FUNCTION ===
  function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
      const newMessage = document.createElement('p');
      newMessage.classList.add('chat-message');
      newMessage.textContent = message;
      messagesDiv.appendChild(newMessage);
      chatInput.value = '';
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  }

  // Logout
  logoutBtn.addEventListener('click', () => {
    signOut(auth)
      .then(() => {
        window.location.href = '../../index.html'; // correct relative path for redirect
      })
      .catch(err => alert("Logout failed: " + err.message));
  });


});