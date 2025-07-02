import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import {
    getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import {
    getFirestore, doc, setDoc, getDoc, collection, addDoc,
    updateDoc, deleteDoc, query, where, getDocs, onSnapshot, arrayUnion, orderBy
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

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
let currentGroup = null;
let tasks = [];

const usernameContainer = document.getElementById('username-container');
const usernameDisplay = document.getElementById('username-display');
const usernameInput = document.getElementById('username-input');

// --- Nickname logic ---
async function loadAndShowNickname() {
    let nickname = 'User';
    console.log("Trying to load nickname for:", currentUser?.uid);

    if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.nickname) {
                nickname = data.nickname;
                console.log("Nickname found:", nickname);
            } else {
                console.log("No nickname field in user document.");
            }
        } else {
            console.log("User document does not exist.");
        }
    }

    usernameDisplay.textContent = nickname;
    usernameInput.value = nickname;
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '../login.html';
    } else {
        currentUser = user;
        await ensureDefaultGroup(); 
        await loadUserGroups();      
        await loadAndShowNickname(); 
    }
});

window.addEventListener('DOMContentLoaded', () => {
    // Sidebar and user info
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarClose = document.getElementById('sidebarClose');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

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

    // Create event
    const createEventModal = document.getElementById('createEventModal');
    const cancelCreateEventBtn = document.getElementById('cancelCreateEventBtn');
    const confirmCreateEventBtn = document.getElementById('confirmCreateEventBtn');
    const eventTitleInput = document.getElementById('eventTitleInput');
    const eventDateInput = document.getElementById('eventDateInput');
    const eventTimeInput = document.getElementById('eventTimeInput');

    // === WEEKLY CALENDAR ===
    window.renderWeek = function renderWeek(date) {
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


    // Calendar placeholders
    const weeklyPlaceholder = document.querySelector('.weekly-placeholder');
    const monthlyPlaceholder = document.querySelector('.monthly-placeholder');
    // === MONTHLY CALENDAR ===
    window.renderMonth = function renderMonth(date) {
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



    usernameContainer.addEventListener('click', () => {
        usernameDisplay.style.display = 'none';
        usernameInput.style.display = 'inline-block';
        usernameInput.value = usernameDisplay.textContent;
        usernameInput.focus();
        usernameInput.select();
    });

    async function saveNickname() {
        const newName = usernameInput.value.trim();
        if (newName.length > 0) {
            if (currentUser) {
                const userRef = doc(db, "users", currentUser.uid);
                await setDoc(userRef, { nickname: newName }, { merge: true });
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const data = userSnap.data();
                    usernameDisplay.textContent = data.nickname || newName;
                    usernameInput.value = data.nickname || newName;
                } else {
                    usernameDisplay.textContent = newName;
                    usernameInput.value = newName;
                }
            } else {
                usernameDisplay.textContent = newName;
                usernameInput.value = newName;
            }
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

    createGroupLink.addEventListener('click', (e) => {
        e.preventDefault();
        const newCode = generateGroupCode();
        generatedGroupCode.textContent = newCode;
        createGroupModal.style.display = 'flex';
        createGroupModal.dataset.generatedCode = newCode;
    });

    cancelCreateGroupBtn.addEventListener('click', () => {
        createGroupModal.style.display = 'none';
    });

    confirmCreateGroupBtn.addEventListener('click', async () => {
        const groupName = groupNameInput.value.trim();
        if (!groupName) return;

        const groupCode = createGroupModal.dataset.generatedCode;
        await saveGroupToFirestore(groupCode, groupName);
        currentGroup = groupCode;
        await loadUserGroups();

        generatedGroupCode.textContent = groupName; 
        createGroupModal.style.display = 'none';
        groupNameInput.value = '';
    });

    confirmJoinGroupBtn.addEventListener('click', async () => {
        const groupCode = joinGroupCodeInput.value.trim().toUpperCase();
        if (!groupCode) return;

        await joinGroup(groupCode);

        joinGroupModal.style.display = 'none';
        joinGroupCodeInput.value = '';
    });


    cancelJoinGroupBtn.addEventListener('click', () => {
        joinGroupModal.style.display = 'none';
    });


    document.querySelector('a[href="joinGroupLink"]').addEventListener('click', (e) => {
        e.preventDefault();
        joinGroupModal.style.display = 'flex';
    });

    // Delete Group Modal
    const deleteGroupModal = document.getElementById('deleteGroupModal');
    const cancelDeleteGroupBtn = document.getElementById('cancelDeleteGroupBtn');
    const confirmDeleteGroupBtn = document.getElementById('confirmDeleteGroupBtn');
    const groupSelectToDelete = document.getElementById('groupSelectToDelete');
    const deleteGroupWarning = document.getElementById('deleteGroupWarning');

    document.querySelector('a[href="deleteGroupLink"]').addEventListener('click', async (e) => {
        e.preventDefault();
        if (!currentUser) return alert("Not authenticated.");

        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return alert("User data not found.");

        const joinedGroups = userSnap.data().joinedGroups || [];
        const defaultGroup = `MY_CALENDAR_${currentUser.uid}`;
        const deletableGroups = joinedGroups.filter(code => code !== defaultGroup);

        if (deletableGroups.length === 0) {
            return alert("No groups available for deletion.");
        }

        groupSelectToDelete.innerHTML = '';

        for (const groupCode of deletableGroups) {
            const groupRef = doc(db, "groups", groupCode);
            const groupSnap = await getDoc(groupRef);
            if (groupSnap.exists()) {
                const groupName = groupSnap.data().name || groupCode;
                const option = document.createElement('option');
                option.value = groupCode;
                option.textContent = groupName;
                groupSelectToDelete.appendChild(option);
            }
        }

        deleteGroupWarning.textContent = "";
        deleteGroupModal.style.display = 'block';
    });

    cancelDeleteGroupBtn.addEventListener('click', () => {
        deleteGroupModal.style.display = 'none';
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === "Escape") {
            closeSidebar(); 
        }
    });


    confirmDeleteGroupBtn.addEventListener('click', async () => {
        const selectedGroup = groupSelectToDelete.value;
        if (!selectedGroup) return;

        const success = await deleteGroup(selectedGroup);
        if (success) {
            deleteGroupModal.style.display = 'none';
        } else {
            deleteGroupWarning.textContent = "Group cannot be deleted. Make sure you are the only member and not deleting the default group.";
        }
    });

    // Chat
    const messages = document.getElementById('messages');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');

    // CREATE EVENT MODAL
    document.querySelector('a[href="createEventLink"]').addEventListener('click', (e) => {
        e.preventDefault();
        createEventModal.style.display = 'flex';
    });
    cancelCreateEventBtn.addEventListener('click', () => {
        createEventModal.style.display = 'none';
    });

    confirmCreateEventBtn.addEventListener('click', async () => {
        const title = eventTitleInput.value.trim();
        const date = eventDateInput.value;
        const time = eventTimeInput.value;

        if (!title || !date || !time) return;

        await addDoc(collection(db, 'chats', currentGroup, 'messages'), {
            userId: currentUser.uid,
            poll: {
                title,
                date,
                time
            },
            votes: { yes: 0, no: 0 },
            createdAt: new Date(),
            finalized: false
        });

        createEventModal.style.display = 'none';
        eventTitleInput.value = '';
        eventDateInput.value = '';
        eventTimeInput.value = '';
    });

    startChatListener();

});


async function ensureDefaultGroup() {
    const defaultGroupCode = `MY_CALENDAR_${currentUser.uid}`;

    const groupRef = doc(db, "groups", defaultGroupCode);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
        await setDoc(groupRef, {
            name: "My Calendar",
            members: [currentUser.uid],
            createdAt: new Date(),
            isDefault: true
        });
    } else {
        const groupData = groupSnap.data();
        if (!groupData.members.includes(currentUser.uid)) {
            await updateDoc(groupRef, {
                members: arrayUnion(currentUser.uid)
            });
        }
    }

    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const userData = userSnap.data();
        if (!userData.joinedGroups || !userData.joinedGroups.includes(defaultGroupCode)) {
            await updateDoc(userRef, {
                joinedGroups: arrayUnion(defaultGroupCode)
            });
        }
    } else {
        await setDoc(userRef, { joinedGroups: [defaultGroupCode] });
    }

    if (!currentGroup) {
        currentGroup = defaultGroupCode;
    }
}

async function createEvent(event) {
    if (!currentUser || !currentGroup) return;
    await addDoc(collection(db, "events"), {
        userId: currentUser.uid,
        group: currentGroup,
        title: event.title,
        date: event.date,
        time: event.time,
        createdAt: new Date()
    });
    console.log('Event created:', event);
}

async function saveGroupToFirestore(groupCode, groupName) {
    if (!currentUser) return;

    const groupRef = doc(db, "groups", groupCode);
    await setDoc(groupRef, {
        name: groupName,
        members: [currentUser.uid],
        createdAt: new Date()
    });

    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, {
        joinedGroups: arrayUnion(groupCode)
    });
}

function renderTasks() {
    const allSlots = document.querySelectorAll('.time-slot');
    allSlots.forEach(slot => {
        slot.querySelectorAll('.task').forEach(task => task.remove());
    });
    if (!tasks.length) return;
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
                taskEl.dataset.date = task.date;
                taskEl.dataset.time = task.time;
                taskEl.style.position = 'absolute';
                taskEl.style.top = `${topOffset}px`;
                taskEl.style.left = '4px';
                taskEl.style.right = '4px';
                slot.style.position = 'relative'; 
                slot.appendChild(taskEl);
                break;
            }
        }
    });
}


let unsubscribeTasks = null; 

function listenToTasks() {
    if (!currentGroup) return;

    if (unsubscribeTasks) unsubscribeTasks();

    const q = query(collection(db, "groups", currentGroup, "tasks"));

    unsubscribeTasks = onSnapshot(q, (snapshot) => {
        tasks = [];
        snapshot.forEach(docSnap => {
            const task = docSnap.data();
            task.id = docSnap.id;
            tasks.push(task);
        });
        renderTasks();
    });
}

function startChatListener() {
    const chatContainer = document.getElementById('messages');

    const q = query(
        collection(db, 'chats', currentGroup, 'messages'),
        orderBy('createdAt')
    );

    onSnapshot(q, async (snapshot) => {
        chatContainer.innerHTML = '';

        const userIds = new Set();
        snapshot.forEach((docSnap) => {
            const message = docSnap.data();
            if (message.userId) userIds.add(message.userId);
        });

        const userIdToNickname = {};
        await Promise.all(Array.from(userIds).map(async (uid) => {
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                userIdToNickname[uid] = userSnap.data().nickname || 'User';
            } else {
                userIdToNickname[uid] = 'User';
            }
        }));

        snapshot.forEach((docSnap) => {
            const message = docSnap.data();
            const div = document.createElement('div');
            let nickname = message.userId ? (userIdToNickname[message.userId] || 'User') : '';
            if (message.poll) {
                let canVote = true;
                if (currentUser && message.userId === currentUser.uid) {
                    canVote = false;
                }
                let voteButtons = '';
                if (canVote) {
                    voteButtons = `
                        <button class="vote-btn" data-id="${docSnap.id}" data-type="yes">✅ Yes</button>
                        <button class="vote-btn" data-id="${docSnap.id}" data-type="no">❌ No</button>
                    `;
                } else {
                    voteButtons = '<em>You cannot vote on your own poll.</em>';
                }
                div.innerHTML = `
                    <strong>📅 ${message.poll.title}</strong><br>
                    <span style="color: #888; font-size: 0.9em;">By: ${nickname}</span><br>
                    Date: ${message.poll.date}<br>
                    Time: ${message.poll.time}<br>
                    ${voteButtons}
                `;
            } else {
                div.innerHTML = `<span style="color: #888; font-size: 0.9em;">${nickname}:</span> ${message.text || '[no content]'}`;
            }
            chatContainer.appendChild(div);
        });

        chatContainer.querySelectorAll('.vote-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const messageId = btn.getAttribute('data-id');
                const voteType = btn.getAttribute('data-type');
                await vote(messageId, voteType);
            });
        });
    });
}

function generateGroupCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}


async function createGroup(groupName) {
    if (!currentUser) return;

    const groupCode = generateGroupCode();
    const groupRef = doc(db, "groups", groupCode);
    await setDoc(groupRef, {
        name: groupName,
        members: [currentUser.uid],
        createdAt: new Date()
    });

    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, {
        joinedGroups: arrayUnion(groupCode)
    });

    currentGroup = groupCode;
    await loadUserGroups();
}

async function joinGroup(groupCode) {
    if (!currentUser) return;

    const normalizedCode = groupCode.trim().toUpperCase();
    const groupRef = doc(db, "groups", normalizedCode);
    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) {
        alert("Group not found.");
        return;
    }

    const groupData = groupSnap.data();
    if (!groupData.members.includes(currentUser.uid)) {
        await updateDoc(groupRef, {
            members: arrayUnion(currentUser.uid)
        });
    }

    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, {
        joinedGroups: arrayUnion(normalizedCode)
    });

    currentGroup = normalizedCode;
    await loadUserGroups();
}

async function saveTaskToFirestore(task) {
    if (!currentUser || !currentGroup) return;

    await setDoc(doc(db, "groups", currentGroup, "tasks", task.id), {
        desc: task.desc,
        date: task.date,
        time: task.time,
        createdAt: new Date()
    });
}

async function deleteTaskFromFirestore(taskId) {
    try {
        await deleteDoc(doc(db, "groups", currentGroup, "tasks", taskId));
    } catch (error) {
        console.error(`Delete failed for taskId ${taskId}:`, error);
    }
}

async function updateTaskInFirestore(taskId, updatedTask) {
    try {
        await updateDoc(doc(db, "groups", currentGroup, "tasks", taskId), updatedTask);
    } catch (error) {
        console.error("Update failed:", error);
    }
}



async function deleteGroup(groupCode) {
    if (!currentUser || !groupCode) return false;

    const defaultGroupCode = `MY_CALENDAR_${currentUser.uid}`;
    if (groupCode === defaultGroupCode) {
        alert("Your default group 'My Calendar' cannot be deleted.");
        return false;
    }

    const groupRef = doc(db, "groups", groupCode);
    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) {
        alert("Group not found.");
        return false;
    }
    const groupData = groupSnap.data();
    const members = groupData.members || [];

    for (const memberId of members) {
        const userRef = doc(db, "users", memberId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const userData = userSnap.data();
            const updatedGroups = (userData.joinedGroups || []).filter(code => code !== groupCode);
            await updateDoc(userRef, { joinedGroups: updatedGroups });
        }
    }

    const q = query(collection(db, "tasks"), where("group", "==", groupCode));
    const snapshot = await getDocs(q);
    for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, "tasks", docSnap.id));
    }

    await deleteDoc(groupRef);

    if (members.includes(currentUser.uid)) {
        currentGroup = null;
        await loadUserGroups();
    }

    return true;
}

async function loadUserGroups() {
    if (!currentUser) return;

    const userDocRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userDocRef);

    let joinedGroups = [];
    if (userSnap.exists()) {
        const data = userSnap.data();
        joinedGroups = data.joinedGroups || [];
    }

    const groupListContainer = document.getElementById("group-list-container");
    groupListContainer.innerHTML = ""; 

    if (!currentGroup && joinedGroups.length > 0) {
        currentGroup = joinedGroups[0];
    }

    if (typeof window.renderWeek !== 'function' || typeof window.renderMonth !== 'function') {
        console.error('renderWeek or renderMonth is not defined.');
        return;
    }

    for (const groupCode of joinedGroups) {
        const groupRef = doc(db, "groups", groupCode);
        const groupSnap = await getDoc(groupRef);
        let groupName = groupCode; 

        if (groupSnap.exists()) {
            const groupData = groupSnap.data();
            if (groupCode === `MY_CALENDAR_${currentUser.uid}`) {
                groupName = "My Calendar";
            } else {
                groupName = groupData.name || groupCode;
            }
        }

        const btn = document.createElement("button");
        btn.textContent = groupName;
        btn.className = "group-btn";
        btn.onclick = () => {
            currentGroup = groupCode;
            window.renderWeek(currentDate);
            window.renderMonth(currentDate);
            listenToTasks();
            startChatListener();
        };

        groupListContainer.appendChild(btn);
    }

    if (currentGroup) {
        window.renderWeek(currentDate);
        window.renderMonth(currentDate);
        listenToTasks();
        startChatListener();
    }
}


async function vote(messageId, voteType) {
    if (!currentUser) return;
    const messageRef = doc(db, 'chats', currentGroup, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);
    if (!messageSnap.exists()) return;

    const messageData = messageSnap.data();
    if (!messageData.votes) return;

    if (messageData.userId === currentUser.uid) {
        alert('You cannot vote on your own poll.');
        return;
    }

    let voters = messageData.voters || [];
    if (voters.includes(currentUser.uid)) {
        alert('You have already voted.');
        return;
    }

    const newCount = (messageData.votes[voteType] || 0) + 1;
    const updatedVotes = {
        ...messageData.votes,
        [voteType]: newCount
    };

    voters.push(currentUser.uid);

    await updateDoc(messageRef, {
        votes: updatedVotes,
        voters: voters
    });
}

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
    console.log('From submit startede');

    const desc = taskDescInput.value.trim();
    const dateStr = taskDateInput.value;
    const timeStr = taskTimeInput.value;
    if (!desc || !dateStr || !timeStr) return;

    const newTask = {
        id: crypto.randomUUID(), 
        date: dateStr,
        time: timeStr,
        desc
    };

    tasks.push(newTask);
    renderTasks();

    console.log('Saving to Firestore');
    await saveTaskToFirestore(newTask);
    taskModal.style.display = 'none';
    console.log('Submitting task:', { desc, dateStr, timeStr });
});
deleteTaskBtn.addEventListener('click', async () => {
    if (selectedTaskEl) {
        const taskId = selectedTaskEl.dataset.id;

        tasks = tasks.filter(t => t.id !== taskId);
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
        renderTasks();
    }

    await updateTaskInFirestore(taskId, {
        date: newDate,
        time: newTime,
        desc: newDesc
    });
    taskDetailsModal.style.display = 'none';
});



function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
}


const logoutBtn = document.getElementById('logoutBtn');

// Logout
logoutBtn.addEventListener('click', () => {
    signOut(auth)
        .then(() => {
            window.location.href = '../../index.html'; 
        })
        .catch(err => alert("Logout failed: " + err.message));
}

);
